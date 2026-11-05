from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Standardizes error responses across the entire REST API.
    Guarantees a consistent JSON structure:
    {
        "error": "<human-readable summary>",
        "details": <dict or list with specific errors>,
        "status_code": <integer HTTP status code>
    }
    """
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, "message_dict"):
            details = exc.message_dict
        elif hasattr(exc, "messages"):
            details = {"non_field_errors": exc.messages}
        else:
            details = {"non_field_errors": [str(exc)]}

        return Response(
            {
                "error": "Validation error.",
                "details": details,
                "status_code": status.HTTP_400_BAD_REQUEST,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
            response.status_code = status.HTTP_401_UNAUTHORIZED

        error_msg = "An error occurred."

        if isinstance(response.data, dict):
            if "detail" in response.data:
                error_msg = str(response.data["detail"])
            else:
                error_msg = "Validation failed."
            details = response.data
        elif isinstance(response.data, list):
            error_msg = "Validation failed."
            details = {"non_field_errors": response.data}
        else:
            details = {"detail": response.data}

        response.data = {
            "error": error_msg,
            "details": details,
            "status_code": response.status_code,
        }

    return response
