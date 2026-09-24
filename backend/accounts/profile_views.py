from django.contrib.auth import get_user_model

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


User = get_user_model()


class ProfileView(APIView):

    permission_classes = [
        IsAuthenticated
    ]


    def get(
        self,
        request,
    ):
        user = request.user

        return Response(
            {
                "id":
                    user.id,

                "username":
                    user.username,

                "email":
                    user.email,

                "first_name":
                    user.first_name,

                "last_name":
                    user.last_name,

                "full_name":
                    (
                        user.get_full_name()
                        or user.username
                    ),

                "role":
                    getattr(
                        user,
                        "role",
                        "ADMIN",
                    ),

                "is_active":
                    user.is_active,

                "date_joined":
                    user.date_joined,
            }
        )


    def put(
        self,
        request,
    ):
        user = request.user

        first_name = (
            request.data.get(
                "first_name",
                ""
            ).strip()
        )

        last_name = (
            request.data.get(
                "last_name",
                ""
            ).strip()
        )

        email = (
            request.data.get(
                "email",
                ""
            ).strip()
        )


        if (
            email
            and User.objects
            .exclude(
                id=user.id
            )
            .filter(
                email__iexact=email
            )
            .exists()
        ):
            return Response(
                {
                    "detail":
                        "This email is already in use."
                },
                status=400,
            )


        user.first_name = (
            first_name
        )

        user.last_name = (
            last_name
        )

        user.email = (
            email
        )


        user.save(
            update_fields=[
                "first_name",
                "last_name",
                "email",
            ]
        )


        return Response(
            {
                "message":
                    "Profile updated successfully.",

                "profile": {
                    "id":
                        user.id,

                    "username":
                        user.username,

                    "email":
                        user.email,

                    "first_name":
                        user.first_name,

                    "last_name":
                        user.last_name,

                    "full_name":
                        (
                            user.get_full_name()
                            or user.username
                        ),

                    "role":
                        getattr(
                            user,
                            "role",
                            "ADMIN",
                        ),
                },
            }
        )