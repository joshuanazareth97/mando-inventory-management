from fastapi import HTTPException


def raise404(resource: str):
    return HTTPException(status_code=404, detail=f"{resource.capitalize()} not found")


def raiseForbidden(resource: str):
    return HTTPException(
        status_code=403,
        detail=f"Insufficient permissions to access {resource if resource else 'this resource'}",
    )
