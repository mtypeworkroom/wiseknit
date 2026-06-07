# ─────────────────────────────────────────────
# WiseKnit Backend — AI Service
# Handles calls to all AI providers
# ─────────────────────────────────────────────

import httpx
import json
import re
from typing import Optional
from ..models.schemas import (
    AIProviderName, ParsedChart, ParsedSymbol, RowReminder
)

# ── Prompts ────────────────────────────────

CHART_PARSE_PROMPT = """You are an expert knitting pattern reader.
Analyze this knitting chart image and extract the key metadata only.

Return ONLY a JSON object with this exact structure, no other text:
{
  "name": "chart name if visible, otherwise Chart",
  "total_rows": <number of rows in the chart>,
  "total_stitches": <number of stitches per row>,
  "repeat_start_row": <row number where the pattern repeat begins, usually 1>,
  "worked_in_round": <true if all rows are RS, false if alternating RS/WS>,
  "symbols": [
    { "symbol": " ", "label": "MC / knit", "description": "Main colour knit stitch", "confident": true },
    { "symbol": "X", "label": "CC / knit", "description": "Contrast colour knit stitch", "confident": true }
  ],
  "notes": "any other useful info visible in the chart e.g. repeats, special instructions",
  "flags": ["list any parts of the chart that were unclear or uncertain"]
}

Focus on:
- Counting rows and stitches accurately
- Reading the legend/key if present
- Identifying whether it is worked flat or in the round
- Noting any repeat markers or section dividers

Do NOT attempt to transcribe every stitch. Return ONLY valid JSON, nothing else."""


def extract_json(text: str) -> dict:
    """Extract JSON from AI response text, handling reasoning model preamble."""
    # Remove markdown code blocks
    clean = re.sub(r'```json|```', '', text).strip()
    # Find ALL JSON objects and return the largest/last complete one
    # Reasoning models often output text before the JSON
    best = None
    depth = 0
    start = None
    for i, ch in enumerate(clean):
        if ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                candidate = clean[start:i+1]
                try:
                    parsed = json.loads(candidate)
                    # Prefer the candidate that looks like a chart (has rows or total_rows)
                    if 'rows' in parsed or 'total_rows' in parsed:
                        return parsed
                    best = parsed
                except Exception:
                    pass
    if best:
        return best
    return json.loads(clean)


def extract_json_array(text: str) -> list:
    """Extract JSON array from AI response text."""
    clean = re.sub(r'```json|```', '', text).strip()
    match = re.search(r'\[[\s\S]*\]', clean)
    if match:
        return json.loads(match.group())
    return json.loads(clean)


# ── Hugging Face ───────────────────────────

async def hf_parse_chart(
    api_key: str,
    image_base64: str,
    legend_text: Optional[str] = None,
    model: str = "google/gemma-4-31B-it"
) -> dict:
    prompt = CHART_PARSE_PROMPT
    if legend_text:
        prompt += f"\n\nLegend from pattern:\n{legend_text}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            "https://router.huggingface.co/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}"
                                }
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.6,
                "stream": False,
            }
        )
        if not res.is_success:
            print(f"HF Parse Error: {res.status_code} — {res.text}")
        res.raise_for_status()
        data = res.json()
        text = data["choices"][0]["message"]["content"]
        return extract_json(text)


async def hf_test_connection(api_key: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            "https://router.huggingface.co/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "meta-llama/Llama-3.1-8B-Instruct",
                "messages": [{"role": "user", "content": "Reply with: ok"}],
                "max_tokens": 5,
                "stream": False
            }
        )
        # Print full error response for debugging
        if not res.is_success:
            print(f"HF Error: {res.status_code} — {res.text}")
        res.raise_for_status()
        return {"success": True, "message": "Connected to Hugging Face successfully"}


# ── Google Gemini ──────────────────────────

async def gemini_parse_chart(
    api_key: str,
    image_base64: str,
    legend_text: Optional[str] = None,
    model: str = "gemini-2.5-flash"
) -> dict:
    prompt = CHART_PARSE_PROMPT
    if legend_text:
        prompt += f"\n\nLegend:\n{legend_text}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            json={
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "image/png", "data": image_base64}},
                    ]
                }],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4096},
            }
        )
        res.raise_for_status()
        data = res.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return extract_json(text)


async def gemini_test_connection(api_key: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
            json={
                "contents": [{"parts": [{"text": "Reply with: ok"}]}],
                "generationConfig": {"maxOutputTokens": 10},
            }
        )
        res.raise_for_status()
        return {"success": True, "message": "Connected to Google Gemini successfully"}


# ── Anthropic Claude ───────────────────────

async def claude_parse_chart(
    api_key: str,
    image_base64: str,
    legend_text: Optional[str] = None,
    model: str = "claude-opus-4-6"
) -> dict:
    prompt = CHART_PARSE_PROMPT
    if legend_text:
        prompt += f"\n\nLegend:\n{legend_text}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 4096,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image", "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": image_base64
                        }},
                    ]
                }]
            }
        )
        res.raise_for_status()
        data = res.json()
        text = data["content"][0]["text"]
        return extract_json(text)


async def claude_test_connection(api_key: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": "claude-opus-4-6",
                "max_tokens": 10,
                "messages": [{"role": "user", "content": "Reply with: ok"}]
            }
        )
        res.raise_for_status()
        return {"success": True, "message": "Connected to Anthropic Claude successfully"}


# ── Provider dispatcher ────────────────────

async def parse_chart(
    provider: AIProviderName,
    api_key: str,
    image_base64: str,
    legend_text: Optional[str] = None,
    model: Optional[str] = None,
) -> dict:
    if provider == AIProviderName.huggingface:
        return await hf_parse_chart(api_key, image_base64, legend_text, model or "google/gemma-4-31B-it")
    elif provider == AIProviderName.gemini:
        return await gemini_parse_chart(api_key, image_base64, legend_text, model or "gemini-2.5-flash")
    elif provider == AIProviderName.claude:
        return await claude_parse_chart(api_key, image_base64, legend_text, model or "claude-opus-4-6")
    else:
        raise ValueError(f"Unknown provider: {provider}")


async def test_connection(provider: AIProviderName, api_key: str) -> dict:
    if provider == AIProviderName.huggingface:
        return await hf_test_connection(api_key)
    elif provider == AIProviderName.gemini:
        return await gemini_test_connection(api_key)
    elif provider == AIProviderName.claude:
        return await claude_test_connection(api_key)
    else:
        raise ValueError(f"Unknown provider: {provider}")
