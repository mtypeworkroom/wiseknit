# ─────────────────────────────────────────────
# WiseKnit Backend — AI Routes
# ─────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    ParseChartRequest, ParseChartResponse,
    TestConnectionRequest, TestConnectionResponse,
    ParsedChart,
)
from ..services import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_connection(request: TestConnectionRequest):
    """Test connection to an AI provider with the given API key."""
    try:
        result = await ai_service.test_connection(request.provider, request.api_key)
        return TestConnectionResponse(**result)
    except Exception as e:
        return TestConnectionResponse(success=False, message=str(e))


@router.post("/parse-chart", response_model=ParseChartResponse)
async def parse_chart(request: ParseChartRequest):
    """Parse a knitting chart image using the specified AI provider."""
    try:
        chart_data = await ai_service.parse_chart(
            provider=request.provider,
            api_key=request.api_key,
            image_base64=request.image_base64,
            legend_text=request.legend_text,
            model=request.model,
        )
        chart = ParsedChart(**chart_data)
        return ParseChartResponse(success=True, chart=chart)
    except Exception as e:
        return ParseChartResponse(success=False, error=str(e))
