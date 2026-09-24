from django.contrib.auth import get_user_model

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsAdmin
from .serializers import (
    RetailVisionTokenSerializer,
    UserCreateSerializer,
    UserSerializer,
)


User = get_user_model()


class RetailVisionLoginView(TokenObtainPairView):

    serializer_class = RetailVisionTokenSerializer


class CurrentUserView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        serializer = UserSerializer(request.user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {
                    "detail":
                        "Refresh token is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            token = RefreshToken(refresh_token)

            token.blacklist()

            return Response(
                {
                    "detail":
                        "Logged out successfully."
                },
                status=status.HTTP_200_OK,
            )

        except Exception:

            return Response(
                {
                    "detail":
                        "Invalid refresh token."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class CreateUserView(generics.CreateAPIView):

    queryset = User.objects.all()

    serializer_class = UserCreateSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]


class UserListView(generics.ListAPIView):

    queryset = User.objects.all().order_by("-created_at")

    serializer_class = UserSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
    ]

    ordering_fields = [
        "username",
        "role",
        "created_at",
    ]


class UserDetailView(
    generics.RetrieveUpdateAPIView
):

    queryset = User.objects.all()

    serializer_class = UserSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]