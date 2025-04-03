import { SignIn } from "@/components/Signin";
import React from "react";

const SignInPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-purple-300 to-pink-400 text-white">
      <SignIn />
    </div>
  );
};

export default SignInPage;