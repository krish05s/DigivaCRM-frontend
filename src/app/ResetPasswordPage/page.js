"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import axios from "redaxios";

export default function ResetPasswordPage() {
 
  const [message, setMessage] = useState("");


  return (
    <div className="flex min-h-screen justify-center items-center">
      <div className="bg-white shadow-lg p-10 rounded-lg w-96">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
        <form className="flex flex-col gap-4">
          <input type="password" placeholder="New Password" className="p-3 border rounded-lg" required />
          <button type="submit" className="p-3 bg-green-600 text-white rounded-lg">Reset Password</button>
        </form>
        {message && <p className="mt-4 text-red-500">{message}</p>}
      </div>
    </div>
  );
}
