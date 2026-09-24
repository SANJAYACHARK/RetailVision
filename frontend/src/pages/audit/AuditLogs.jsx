import {
  Activity,
  CheckCircle2,
  RefreshCcw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "../../api/api";


function AuditLogs() {
  const [logs, setLogs] =
    useState([]);

  const [summary, setSummary] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [action, setAction] =
    useState("");


  // =========================================================
  // DATE
  // =========================================================

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "—";
    }


    return new Date(
      value
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  // =========================================================
  // FETCH
  // =========================================================

  const fetchAuditLogs =
    useCallback(
      async () => {
        setLoading(true);
        setError("");


        try {
          const params = {
            limit: 300,
          };


          if (search.trim()) {
            params.search =
              search.trim();
          }


          if (action) {
            params.action =
              action;
          }


          const [
            logResponse,
            summaryResponse,
          ] = await Promise.all([
            api.get(
              "activity/audit-logs/",
              {
                params,
              }
            ),

            api.get(
              "activity/audit-logs/summary/"
            ),
          ]);


          setLogs(
            logResponse.data
              ?.results ||
            []
          );


          setSummary(
            summaryResponse.data ||
            {}
          );

        } catch (error) {
          console.error(
            "Audit logs error:",
            error
          );


          setError(
            error.response
              ?.data
              ?.detail ||
            "Unable to load audit logs."
          );

        } finally {
          setLoading(false);
        }
      },
      [
        search,
        action,
      ]
    );


  useEffect(() => {
    const timer =
      setTimeout(
        () => {
          fetchAuditLogs();
        },
        300
      );


    return () =>
      clearTimeout(
        timer
      );
  }, [
    fetchAuditLogs,
  ]);


  return (
    <div className="page-content">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Administration
          </p>


          <h1 className="page-title">
            Audit Logs
          </h1>


          <p className="page-description">
            Track important user activity
            and system API operations.
          </p>

        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={
            fetchAuditLogs
          }
        >
          <RefreshCcw
            size={16}
          />

          Refresh
        </button>

      </div>


      {
        error && (
          <div className="page-error">
            {error}
          </div>
        )
      }


      {/* KPI */}

      <div className="audit-kpi-grid">

        <AuditKpi
          icon={
            <Activity
              size={20}
            />
          }
          label="Total Logs"
          value={
            summary.total_logs ||
            0
          }
        />


        <AuditKpi
          icon={
            <ShieldCheck
              size={20}
            />
          }
          label="Today's Activity"
          value={
            summary.today_logs ||
            0
          }
        />


        <AuditKpi
          icon={
            <CheckCircle2
              size={20}
            />
          }
          label="Successful"
          value={
            summary.successful ||
            0
          }
        />


        <AuditKpi
          icon={
            <XCircle
              size={20}
            />
          }
          label="Failed"
          value={
            summary.failed ||
            0
          }
        />

      </div>


      {/* FILTERS */}

      <div className="audit-toolbar">

        <div className="audit-search">

          <Search
            size={17}
          />


          <input
            type="text"
            value={
              search
            }
            onChange={
              (event) =>
                setSearch(
                  event.target.value
                )
            }
            placeholder="Search user, module or path..."
          />

        </div>


        <select
          className="form-select audit-action-filter"
          value={
            action
          }
          onChange={
            (event) =>
              setAction(
                event.target.value
              )
          }
        >
          <option value="">
            All Actions
          </option>

          <option value="CREATE">
            Create
          </option>

          <option value="UPDATE">
            Update
          </option>

          <option value="DELETE">
            Delete
          </option>

          <option value="VIEW">
            View
          </option>

          <option value="LOGIN">
            Login
          </option>

          <option value="LOGOUT">
            Logout
          </option>

          <option value="EXPORT">
            Export
          </option>
        </select>

      </div>


      {/* TABLE */}

      <div className="analytics-card">

        <div className="table-wrapper">

          <table className="data-table audit-table">

            <thead>

              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Module</th>
                <th>Request</th>
                <th>Status</th>
                <th>IP Address</th>
                <th>Date & Time</th>
              </tr>

            </thead>


            <tbody>

              {
                loading
                  ? (
                    <tr>

                      <td colSpan={8}>

                        <div className="analytics-empty">
                          Loading audit logs...
                        </div>

                      </td>

                    </tr>
                  )
                  : logs.length === 0
                    ? (
                      <tr>

                        <td colSpan={8}>

                          <div className="analytics-empty">
                            No audit logs found.
                          </div>

                        </td>

                      </tr>
                    )
                    : logs.map(
                      (log) => (

                        <tr key={log.id}>

                          <td>

                            <div className="table-primary-text">
                              {
                                log.user_name ||
                                log.username ||
                                "System"
                              }
                            </div>

                          </td>


                          <td>
                            {
                              String(
                                log.role ||
                                "—"
                              )
                                .replace(
                                  /_/g,
                                  " "
                                )
                            }
                          </td>


                          <td>

                            <AuditBadge
                              value={
                                log.action
                              }
                            />

                          </td>


                          <td>
                            {
                              log.module ||
                              "—"
                            }
                          </td>


                          <td>

                            <div className="audit-request-cell">

                              <strong>
                                {
                                  log.request_method
                                }
                              </strong>

                              <span>
                                {
                                  log.path
                                }
                              </span>

                            </div>

                          </td>


                          <td>

                            <span
                              className={
                                log.success
                                  ? "audit-status audit-status-success"
                                  : "audit-status audit-status-failed"
                              }
                            >
                              {
                                log.status_code ||
                                "—"
                              }
                            </span>

                          </td>


                          <td>
                            {
                              log.ip_address ||
                              "—"
                            }
                          </td>


                          <td>
                            {
                              formatDateTime(
                                log.created_at
                              )
                            }
                          </td>

                        </tr>

                      )
                    )
              }

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


function AuditKpi({
  icon,
  label,
  value,
}) {
  return (
    <div className="audit-kpi-card">

      <div className="audit-kpi-icon">
        {icon}
      </div>


      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}


function AuditBadge({
  value,
}) {
  const normalized =
    String(
      value ||
      ""
    )
      .toLowerCase();


  return (
    <span
      className={
        `audit-action-badge audit-action-${normalized}`
      }
    >
      {
        value ||
        "OTHER"
      }
    </span>
  );
}


export default AuditLogs;