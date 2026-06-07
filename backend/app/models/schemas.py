from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class AIProviderName(str, Enum):
    huggingface = "huggingface"
    gemini = "gemini"
    claude = "claude"


# ── Chart parsing ──────────────────────────

class ParseChartRequest(BaseModel):
    provider: AIProviderName
    api_key: str
    image_base64: str
    legend_text: Optional[str] = None
    model: Optional[str] = None


class ParsedSymbol(BaseModel):
    symbol: str
    label: str
    description: str
    confident: bool = True


class ParsedChart(BaseModel):
    name: str
    total_rows: int
    total_stitches: int
    repeat_start_row: int = 1
    worked_in_round: bool = False
    symbols: List[ParsedSymbol] = []
    notes: Optional[str] = None
    flags: List[str] = []


class ParseChartResponse(BaseModel):
    success: bool
    chart: Optional[ParsedChart] = None
    error: Optional[str] = None


# ── Row reminders ──────────────────────────

class GenerateRemindersRequest(BaseModel):
    provider: AIProviderName
    api_key: str
    chart: ParsedChart
    model: Optional[str] = None


class RowReminder(BaseModel):
    row_number: int
    message: str
    type: str = "info"


class GenerateRemindersResponse(BaseModel):
    success: bool
    reminders: List[RowReminder] = []
    error: Optional[str] = None


# ── Connection test ────────────────────────

class TestConnectionRequest(BaseModel):
    provider: AIProviderName
    api_key: str


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
