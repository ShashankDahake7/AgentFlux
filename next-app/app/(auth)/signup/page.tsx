import { SignUp } from "@/components/Signup";
import React from "react";

const SignUpPage = () => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-2xl rounded-2xl">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Sign Up
      </h1>
      <SignUp />
    </div>
  );
};

export default SignUpPage;
