from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class ChangePasswordView(APIView):

    permission_classes = [
        IsAuthenticated
    ]


    def post(
        self,
        request,
    ):
        user = request.user


        current_password = (
            request.data.get(
                "current_password",
                ""
            )
        )

        new_password = (
            request.data.get(
                "new_password",
                ""
            )
        )

        confirm_password = (
            request.data.get(
                "confirm_password",
                ""
            )
        )


        if not current_password:
            return Response(
                {
                    "detail":
                        "Current password is required."
                },
                status=400,
            )


        if not new_password:
            return Response(
                {
                    "detail":
                        "New password is required."
                },
                status=400,
            )


        if (
            new_password
            != confirm_password
        ):
            return Response(
                {
                    "detail":
                        "New password and confirmation do not match."
                },
                status=400,
            )


        if not user.check_password(
            current_password
        ):
            return Response(
                {
                    "detail":
                        "Current password is incorrect."
                },
                status=400,
            )


        try:
            validate_password(
                new_password,
                user=user,
            )

        except DjangoValidationError as error:
            return Response(
                {
                    "detail":
                        error.messages
                },
                status=400,
            )


        user.set_password(
            new_password
        )

        user.save(
            update_fields=[
                "password"
            ]
        )


        return Response(
            {
                "message":
                    "Password changed successfully."
            }
        )