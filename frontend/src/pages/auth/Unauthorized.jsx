import {
  ShieldAlert,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";


function Unauthorized() {

  return (

    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[#f9f7e8]
        p-6
      "
    >

      <div
        className="
          max-w-md
          rounded-[28px]
          border
          border-[#e5e2d5]
          bg-[#fffef9]
          p-10
          text-center
          shadow-[0_20px_50px_rgba(37,37,35,0.06)]
        "
      >

        <div
          className="
            mx-auto
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-[#252523]
            text-[#e8d65a]
          "
        >
          <ShieldAlert size={25} />
        </div>


        <h1
          className="
            mt-6
            text-2xl
            font-semibold
            text-[#252523]
          "
        >
          Access denied
        </h1>


        <p
          className="
            mt-3
            text-sm
            leading-6
            text-[#85837a]
          "
        >
          Your RetailVision account does not
          have permission to access this page.
        </p>


        <Link
          to="/dashboard"
          className="
            mt-7
            inline-flex
            rounded-xl
            bg-[#252523]
            px-5
            py-3
            text-sm
            font-medium
            text-white
          "
        >
          Back to Dashboard
        </Link>

      </div>

    </div>
  );
}


export default Unauthorized;