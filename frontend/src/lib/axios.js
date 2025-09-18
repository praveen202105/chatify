import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://10.238.15.111:3001/api" : "/api",
  withCredentials: true,
});
