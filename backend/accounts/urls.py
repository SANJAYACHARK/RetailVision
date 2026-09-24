from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RetailVisionLoginView,
    CurrentUserView,
    LogoutView,
    CreateUserView,
    UserListView,
    UserDetailView,
)
from django.urls import path

from .profile_views import ProfileView
from .security_views import ChangePasswordView

urlpatterns = [
    path(
        "login/",
        RetailVisionLoginView.as_view(),
        name="login",
    ),

    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),

    path(
        "me/",
        CurrentUserView.as_view(),
        name="current-user",
    ),

    path(
        "users/",
        UserListView.as_view(),
        name="user-list",
    ),

    path(
        "users/create/",
        CreateUserView.as_view(),
        name="user-create",
    ),

    path(
        "users/<int:pk>/",
        UserDetailView.as_view(),
        name="user-detail",
    ),
    
    path(
        "profile/",
        ProfileView.as_view(),
        name="profile",
    ),

    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),
    
]