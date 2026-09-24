import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CircleCheck,
  Info,
  Package,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../api/api";


function NotificationDropdown() {
  const navigate =
    useNavigate();


  const wrapperRef =
    useRef(null);


  const [open, setOpen] =
    useState(false);


  const [notifications, setNotifications] =
    useState([]);


  const [unreadCount, setUnreadCount] =
    useState(0);


  const [loading, setLoading] =
    useState(false);


  // =========================================================
  // LOAD
  // =========================================================

  const fetchNotifications =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              "activity/notifications/",
              {
                params: {
                  limit: 20,
                },
              }
            );


          setNotifications(
            response.data
              ?.results ||
            []
          );


          setUnreadCount(
            response.data
              ?.unread_count ||
            0
          );

        } catch (error) {
          console.error(
            "Notification load error:",
            error
          );
        }
      },
      []
    );


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchNotifications();


    const interval =
      setInterval(
        fetchNotifications,
        60000
      );


    return () =>
      clearInterval(
        interval
      );
  }, [
    fetchNotifications,
  ]);


  // =========================================================
  // OUTSIDE CLICK
  // =========================================================

  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          wrapperRef.current
          &&
          !wrapperRef.current.contains(
            event.target
          )
        ) {
          setOpen(false);
        }
      };


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  // =========================================================
  // OPEN
  // =========================================================

  const toggleDropdown =
    async () => {
      const newValue =
        !open;


      setOpen(
        newValue
      );


      if (newValue) {
        setLoading(true);

        await fetchNotifications();

        setLoading(false);
      }
    };


  // =========================================================
  // READ
  // =========================================================

  const markAsRead =
    async (
      notification
    ) => {
      if (
        !notification.is_read
      ) {
        try {
          await api.patch(
            `activity/notifications/${notification.id}/read/`
          );


          setNotifications(
            (previous) =>
              previous.map(
                (item) =>
                  item.id ===
                    notification.id
                    ? {
                        ...item,
                        is_read: true,
                      }
                    : item
              )
          );


          setUnreadCount(
            (previous) =>
              Math.max(
                previous - 1,
                0
              )
          );

        } catch (error) {
          console.error(
            "Mark read error:",
            error
          );
        }
      }


      if (notification.link) {
        setOpen(false);

        navigate(
          notification.link
        );
      }
    };


  // =========================================================
  // MARK ALL
  // =========================================================

  const markAllRead =
    async () => {
      try {
        await api.patch(
          "activity/notifications/read-all/"
        );


        setNotifications(
          (previous) =>
            previous.map(
              (item) => ({
                ...item,
                is_read: true,
              })
            )
        );


        setUnreadCount(0);

      } catch (error) {
        console.error(
          "Mark all read error:",
          error
        );
      }
    };


  // =========================================================
  // DELETE
  // =========================================================

  const deleteNotification =
    async (
      event,
      notificationId
    ) => {
      event.stopPropagation();


      try {
        const current =
          notifications.find(
            (item) =>
              item.id ===
              notificationId
          );


        await api.delete(
          `activity/notifications/${notificationId}/`
        );


        setNotifications(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                notificationId
            )
        );


        if (
          current
          &&
          !current.is_read
        ) {
          setUnreadCount(
            (previous) =>
              Math.max(
                previous - 1,
                0
              )
          );
        }

      } catch (error) {
        console.error(
          "Delete notification error:",
          error
        );
      }
    };


  // =========================================================
  // ICON
  // =========================================================

  const renderIcon =
    (type) => {
      switch (type) {
        case "SUCCESS":
          return (
            <CircleCheck
              size={18}
            />
          );

        case "WARNING":
          return (
            <AlertTriangle
              size={18}
            />
          );

        case "ERROR":
          return (
            <XCircle
              size={18}
            />
          );

        case "STOCK":
          return (
            <Package
              size={18}
            />
          );

        default:
          return (
            <Info
              size={18}
            />
          );
      }
    };


  // =========================================================
  // DATE
  // =========================================================

  const formatTime =
    (value) => {
      if (!value) {
        return "";
      }


      return new Date(
        value
      ).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    };


  return (
    <div
      className="notification-wrapper"
      ref={
        wrapperRef
      }
    >

      <button
        type="button"
        className="notification-btn"
        onClick={
          toggleDropdown
        }
        aria-label="Notifications"
      >

        <Bell
          size={19}
        />


        {
          unreadCount > 0 && (

            <span className="notification-count">
              {
                unreadCount > 99
                  ? "99+"
                  : unreadCount
              }
            </span>
          )
        }

      </button>


      {
        open && (

          <div className="notification-dropdown">

            <div className="notification-dropdown-header">

              <div>

                <h3>
                  Notifications
                </h3>

                <span>
                  {
                    unreadCount
                  }
                  {" "}
                  unread
                </span>

              </div>


              {
                unreadCount > 0 && (

                  <button
                    type="button"
                    onClick={
                      markAllRead
                    }
                  >

                    <CheckCheck
                      size={15}
                    />

                    Mark all read

                  </button>
                )
              }

            </div>


            <div className="notification-list">

              {
                loading
                  ? (
                    <div className="notification-empty">
                      Loading...
                    </div>
                  )
                  : notifications.length === 0
                    ? (
                      <div className="notification-empty">

                        <Bell
                          size={28}
                        />

                        <strong>
                          No notifications
                        </strong>

                        <span>
                          You're all caught up.
                        </span>

                      </div>
                    )
                    : notifications.map(
                      (notification) => (

                        <button
                          type="button"
                          key={
                            notification.id
                          }
                          className={
                            `notification-item ${
                              !notification.is_read
                                ? "unread"
                                : ""
                            }`
                          }
                          onClick={
                            () =>
                              markAsRead(
                                notification
                              )
                          }
                        >

                          <div
                            className={
                              `notification-item-icon notification-type-${String(
                                notification.notification_type ||
                                "INFO"
                              ).toLowerCase()}`
                            }
                          >
                            {
                              renderIcon(
                                notification.notification_type
                              )
                            }
                          </div>


                          <div className="notification-item-content">

                            <strong>
                              {
                                notification.title
                              }
                            </strong>

                            <p>
                              {
                                notification.message
                              }
                            </p>

                            <span>
                              {
                                formatTime(
                                  notification.created_at
                                )
                              }
                            </span>

                          </div>


                          <div className="notification-item-actions">

                            {
                              !notification.is_read && (
                                <span
                                  className="notification-unread-dot"
                                  title="Unread"
                                />
                              )
                            }


                            <span
                              role="button"
                              tabIndex={0}
                              className="notification-delete"
                              onClick={
                                (event) =>
                                  deleteNotification(
                                    event,
                                    notification.id
                                  )
                              }
                            >
                              <Trash2
                                size={14}
                              />
                            </span>

                          </div>

                        </button>

                      )
                    )
              }

            </div>


            <div className="notification-dropdown-footer">

              <Check
                size={14}
              />

              RetailVision Alerts

            </div>

          </div>
        )
      }

    </div>
  );
}


export default NotificationDropdown;