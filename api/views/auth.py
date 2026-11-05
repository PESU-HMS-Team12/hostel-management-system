from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions import HasHMSRole
from api.serializers.auth import (
    CurrentUserSerializer,
    LoginSerializer,
    StudentSignupResponseSerializer,
    StudentSignupSerializer,
)


class CSRFTokenView(APIView):
    """
    Supplies the CSRF cookie and token for single-page applications and decoupled clients.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        summary="Retrieve CSRF Token",
        description="Sets the CSRF cookie and returns the token in the response body.",
        request=None,
        responses={200: OpenApiResponse(description="CSRF token retrieved successfully")},
        tags=["Authentication"],
    )
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        token = get_token(request)
        response = Response({"csrfToken": token}, status=status.HTTP_200_OK)
        response["X-CSRFToken"] = token
        return response


class LoginView(APIView):
    """
    Authenticates a user via username or email and password, verifies their HMS role,
    and initiates a server-side session.
    """
    permission_classes = [AllowAny]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        # Enforce CSRF protection for login requests including unauthenticated clients
        SessionAuthentication().enforce_csrf(request)

    @extend_schema(
        summary="User Login",
        description="Authenticates the user and creates a secure server-side session cookie.",
        request=LoginSerializer,
        responses={
            200: CurrentUserSerializer,
            400: OpenApiResponse(description="Invalid credentials or missing role"),
            403: OpenApiResponse(description="CSRF verification failed"),
        },
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        login(request, user)

        user_serializer = CurrentUserSerializer(user)
        return Response(user_serializer.data, status=status.HTTP_200_OK)


class StudentSignupView(APIView):
    """
    Allows an eligible active Student to self-register an HMS account.
    Created accounts remain inactive (pending) until approved by an Administrator.
    """
    permission_classes = [AllowAny]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        SessionAuthentication().enforce_csrf(request)

    @extend_schema(
        summary="Student Account Self-Registration",
        description=(
            "Registers a student user account linked to an existing active Student record. "
            "The account is created in a pending (inactive) state and requires Administrator approval."
        ),
        request=StudentSignupSerializer,
        responses={
            201: StudentSignupResponseSerializer,
            400: OpenApiResponse(description="Validation failed"),
            403: OpenApiResponse(description="CSRF verification failed"),
        },
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = StudentSignupSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        student = serializer.validated_data["student"]

        return Response(
            {
                "message": "Your account registration has been submitted and is awaiting hostel administration approval.",
                "username": user.username,
                "student_id": student.student_id,
                "status": "PENDING_APPROVAL",
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    """
    Logs out the current user and invalidates the server-side session.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="User Logout",
        description="Flushes the current user session and invalidates session cookies.",
        request=None,
        responses={200: OpenApiResponse(description="Logged out successfully")},
        tags=["Authentication"],
    )
    def post(self, request):
        logout(request)
        return Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


class CurrentUserView(APIView):
    """
    Retrieves information, role, and linked profile for the currently authenticated user.
    """
    permission_classes = [IsAuthenticated, HasHMSRole]

    @extend_schema(
        summary="Current User Profile",
        description="Returns profile details, role, and active room allocation (if a student).",
        request=None,
        responses={
            200: CurrentUserSerializer,
            401: OpenApiResponse(description="Authentication required"),
            403: OpenApiResponse(description="No HMS role assigned"),
        },
        tags=["Authentication"],
    )
    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
