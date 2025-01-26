import { SignIn } from "@/components/Signin";
import React from "react";

const SignInPage = () => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-2xl rounded-2xl">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Sign In
      </h1>
      <SignIn />
    </div>
  );
};

export default SignInPage;