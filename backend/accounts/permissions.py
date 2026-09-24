from rest_framework.permissions import (
    BasePermission,
)


# ============================================================
# ROLE CONSTANTS
# ============================================================

ADMIN_ROLE = "ADMIN"

STORE_MANAGER_ROLE = "STORE_MANAGER"

SALES_EXECUTIVE_ROLE = "SALES_EXECUTIVE"


ADMIN_ROLES = [
    ADMIN_ROLE,
]


MANAGER_ROLES = [
    ADMIN_ROLE,
    STORE_MANAGER_ROLE,
]


ALL_BUSINESS_ROLES = [
    ADMIN_ROLE,
    STORE_MANAGER_ROLE,
    SALES_EXECUTIVE_ROLE,
]


# ============================================================
# ROLE HELPER
# ============================================================

def get_user_role(user):
    """
    Safely return the logged-in user's role
    in uppercase format.
    """

    if not user:
        return ""

    role = getattr(
        user,
        "role",
        "",
    )

    return str(
        role or ""
    ).upper()


# ============================================================
# ADMIN ONLY
# ============================================================

class IsAdmin(BasePermission):
    """
    Existing backward-compatible admin permission.

    Existing project files may already use:

        from accounts.permissions import IsAdmin
    """

    message = (
        "Administrator access is required."
    )


    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user


        if (
            not user
            or not user.is_authenticated
        ):
            return False


        if user.is_superuser:
            return True


        return (
            get_user_role(
                user
            )
            == ADMIN_ROLE
        )


# ============================================================
# ADMIN ROLE ALIAS
# ============================================================

class IsAdminRole(
    IsAdmin
):
    """
    Newer name for admin-only permission.

    Both now work:

        IsAdmin
        IsAdminRole
    """

    pass


# ============================================================
# ADMIN OR STORE MANAGER
# ============================================================

class IsAdminOrManager(
    BasePermission
):
    """
    Backward-compatible permission.

    Existing project files such as products/views.py
    already import:

        IsAdminOrManager
    """

    message = (
        "Administrator or Store Manager "
        "access is required."
    )


    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user


        if (
            not user
            or not user.is_authenticated
        ):
            return False


        if user.is_superuser:
            return True


        return (
            get_user_role(
                user
            )
            in MANAGER_ROLES
        )


# ============================================================
# STORE MANAGER OR ADMIN
# ============================================================

class IsManagerOrAdmin(
    IsAdminOrManager
):
    """
    Alias for IsAdminOrManager.

    Both names are supported:

        IsAdminOrManager
        IsManagerOrAdmin
    """

    pass


# ============================================================
# ADMIN / MANAGER / SALES EXECUTIVE
# ============================================================

class IsSalesStaff(
    BasePermission
):
    """
    Allows all RetailVision business roles.
    """

    message = (
        "Sales staff access is required."
    )


    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user


        if (
            not user
            or not user.is_authenticated
        ):
            return False


        if user.is_superuser:
            return True


        return (
            get_user_role(
                user
            )
            in ALL_BUSINESS_ROLES
        )


# ============================================================
# ADMIN/MANAGER WRITE, SALES EXECUTIVE READ
# ============================================================

class IsAdminOrManagerOrReadOnly(
    BasePermission
):
    """
    Admin:
        full access

    Store Manager:
        full access

    Sales Executive:
        GET / HEAD / OPTIONS only
    """

    message = (
        "Only Administrator or Store Manager "
        "can modify this resource."
    )


    SAFE_METHODS = [
        "GET",
        "HEAD",
        "OPTIONS",
    ]


    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user


        if (
            not user
            or not user.is_authenticated
        ):
            return False


        if user.is_superuser:
            return True


        role = get_user_role(
            user
        )


        if (
            request.method
            in self.SAFE_METHODS
        ):
            return (
                role
                in ALL_BUSINESS_ROLES
            )


        return (
            role
            in MANAGER_ROLES
        )


# ============================================================
# BUSINESS DATA MANAGEMENT
# ============================================================

class CanManageBusinessData(
    BasePermission
):
    """
    Same practical behavior as
    IsAdminOrManagerOrReadOnly.

    Admin and Manager:
        full access

    Sales Executive:
        read-only
    """

    message = (
        "You do not have permission "
        "to modify this resource."
    )


    SAFE_METHODS = [
        "GET",
        "HEAD",
        "OPTIONS",
    ]


    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user


        if (
            not user
            or not user.is_authenticated
        ):
            return False


        if user.is_superuser:
            return True


        role = get_user_role(
            user
        )


        if (
            request.method
            in self.SAFE_METHODS
        ):
            return (
                role
                in ALL_BUSINESS_ROLES
            )


        return (
            role
            in MANAGER_ROLES
        )


# ============================================================
# READ-ONLY AUTHENTICATED BUSINESS USER
# ============================================================

class IsBusinessUserReadOnly(
    BasePermission
):
    """
    All RetailVision roles can access
    only safe/read methods.
    """

    message = (
        "This resource is read-only."
    )


    SAFE_METHODS = [
        "GET",
        "HEAD",
        "OPTIONS",
    ]


    def has_permission(
        self,
        request,
        view,
    ):
        user = request.user


        if (
            not user
            or not user.is_authenticated
        ):
            return False


        if (
            request.method
            not in self.SAFE_METHODS
        ):
            return False


        if user.is_superuser:
            return True


        return (
            get_user_role(
                user
            )
            in ALL_BUSINESS_ROLES
        )