import {
  useEffect,
  useState,
} from "react";

import api from "../../api/api";


function UserManagement() {

  const [users, setUsers] =
    useState([]);


  useEffect(() => {

    const loadUsers =
      async () => {

        try {

          const response =
            await api.get(
              "accounts/users/"
            );

          setUsers(
            response.data.results ||
            response.data
          );

        } catch (error) {

          console.error(error);
        }
      };


    loadUsers();

  }, []);


  return (

    <div className="min-h-screen p-8">

      <h1
        className="
          text-3xl
          font-semibold
        "
      >
        User Management
      </h1>


      <div
        className="
          mt-7
          overflow-hidden
          rounded-[24px]
          border
          border-[#e5e2d5]
          bg-[#fffef9]
        "
      >

        {
          users.map(
            (user) => (

              <div
                key={user.id}
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-[#ece9df]
                  px-6
                  py-4
                  last:border-none
                "
              >

                <div>

                  <p
                    className="
                      font-medium
                    "
                  >
                    {user.username}
                  </p>

                  <p
                    className="
                      text-xs
                      text-[#88867d]
                    "
                  >
                    {user.email}
                  </p>

                </div>


                <span
                  className="
                    rounded-full
                    bg-[#eee594]
                    px-3
                    py-1
                    text-xs
                    font-medium
                  "
                >
                  {user.role_display}
                </span>

              </div>

            )
          )
        }

      </div>

    </div>

  );
}


export default UserManagement;