import axios from "axios";
import { signOut } from "next-auth/react";

const Axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_DIR_PATH,
  headers: {
    "Content-Type": "application/json",
  },
});

Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status == 401) {
      signOut({ callbackUrl: "/login" });
    }
    return Promise.reject(error);
  }
);

async function postData(endpoint, data = {}, customHeader = {}) {
  try {
    const header = {
      "X-ENDPOINT": endpoint,
      ...customHeader,
    };
    const response = await Axios.post("", data, {
      headers: header,
    });
    return response;
  } catch (error) {
    if (error.response.status == 402) {
      signOut({ callbackUrl: "/login" });
    }
    throw error;
  }
}

export default postData;
