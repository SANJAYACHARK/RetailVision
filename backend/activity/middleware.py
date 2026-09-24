from .models import AuditLog


# ============================================================
# HELPERS
# ============================================================

def get_client_ip(
    request,
):
    forwarded_for = (
        request.META.get(
            "HTTP_X_FORWARDED_FOR"
        )
    )


    if forwarded_for:
        return (
            forwarded_for
            .split(",")[0]
            .strip()
        )


    return request.META.get(
        "REMOTE_ADDR"
    )


def get_action(
    method,
    path,
):
    path_lower = (
        path.lower()
    )


    if (
        "login"
        in path_lower
        or "token"
        in path_lower
    ):
        return (
            AuditLog.Action.LOGIN
        )


    if "logout" in path_lower:
        return (
            AuditLog.Action.LOGOUT
        )


    if "export" in path_lower:
        return (
            AuditLog.Action.EXPORT
        )


    mapping = {
        "POST":
            AuditLog.Action.CREATE,

        "PUT":
            AuditLog.Action.UPDATE,

        "PATCH":
            AuditLog.Action.UPDATE,

        "DELETE":
            AuditLog.Action.DELETE,

        "GET":
            AuditLog.Action.VIEW,
    }


    return mapping.get(
        method.upper(),
        AuditLog.Action.OTHER,
    )


def get_module(
    path,
):
    cleaned = (
        path
        .strip("/")
        .split("/")
    )


    # Example:
    #
    # /api/products/
    #
    # [
    #   "api",
    #   "products"
    # ]

    if len(cleaned) >= 2:
        if cleaned[0] == "api":
            return (
                cleaned[1]
                .replace("-", " ")
                .title()
            )


    if cleaned:
        return (
            cleaned[0]
            .replace("-", " ")
            .title()
        )


    return "System"


# ============================================================
# AUDIT LOG MIDDLEWARE
# ============================================================

class AuditLogMiddleware:

    def __init__(
        self,
        get_response,
    ):
        self.get_response = (
            get_response
        )


    def __call__(
        self,
        request,
    ):
        response = (
            self.get_response(
                request
            )
        )


        try:
            self.create_log(
                request,
                response,
            )

        except Exception as error:
            # Audit logging should never
            # crash the main application.
            print(
                "Audit log middleware error:",
                error,
            )


        return response


    def create_log(
        self,
        request,
        response,
    ):
        path = request.path


        if not path.startswith(
            "/api/"
        ):
            return


        # Do not audit the audit-log
        # reading endpoint itself.
        if path.startswith(
            "/api/activity/audit-logs/"
        ):
            return


        # Avoid recording repeated
        # notification polling.
        if (
            request.method == "GET"
            and path.startswith(
                "/api/activity/notifications/"
            )
        ):
            return


        user = getattr(
            request,
            "user",
            None,
        )


        is_authenticated = (
            user
            and user.is_authenticated
        )


        username = (
            getattr(
                user,
                "username",
                "",
            )
            if is_authenticated
            else ""
        )


        status_code = getattr(
            response,
            "status_code",
            None,
        )


        action = get_action(
            request.method,
            path,
        )


        description = (
            f"{request.method} {path}"
        )


        AuditLog.objects.create(
            user=(
                user
                if is_authenticated
                else None
            ),

            username=username,

            action=action,

            module=get_module(
                path
            ),

            description=description,

            request_method=
                request.method,

            path=path,

            ip_address=
                get_client_ip(
                    request
                ),

            status_code=
                status_code,

            success=(
                status_code is not None
                and status_code < 400
            ),
        )