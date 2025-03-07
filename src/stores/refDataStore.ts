import { RefData } from "@/types/refData";
import axios from "axios";

export const useRefDataStore = defineStore("refData", () => {
  const refData = ref<RefData[]>([]);

  const getRefData = async (type?: String) => {
    let url = "/api/refDatas";
    if (type) {
      url = `/api/refDatas/type/${type}`;
    }
    const response = await fetch(url);
    return await response.json();
  };

  const updateRefData = async (refData: RefData) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
      console.log("request data:" + JSON.stringify(refData));
      const response = await axios.put(
        `/api/refDatas/${refData.id}`,
        JSON.stringify(refData),
        config
      );

      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addRefData = async (refData: RefData) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
      console.log(JSON.stringify(refData));
      const response = await axios.post(
        `/api/refDatas`,
        JSON.stringify(refData),
        config
      );

      console.log("Response:", response.data);

      return response.data;
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteRefData = async (refData: RefData) => {
    try {
      const config = {
        headers: {},
      };
      const response = await axios.delete(
        `/api/refDatas/${refData.id}`,
        config
      );

      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return {
    refData,
    getRefData,
    addRefData,
    updateRefData,
    deleteRefData,
  };
});
