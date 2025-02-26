import { RefData } from "@/types/refData";
import { RentalPayment } from "@/types/rentalPayment";
import axios from "axios";

export const useRentalPaymentStore = defineStore("rentalPayment", () => {
  const rentalPayments = ref<RentalPayment[]>([]);
  const types = ref<RefData[]>([]);
  const rentalPayment = ref();

  const addRentalPayment = async (rentalpayment: RentalPayment) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
      console.log(JSON.stringify(rentalpayment));
      const response = await axios.post(
        `/api/rentalPayments`,
        JSON.stringify(rentalpayment),
        config
      );

      console.log("Response:", response.data);

      return response.data;
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const updateRentalPayment = async (rentalpayment: RentalPayment) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
      console.log(JSON.stringify(rentalpayment));
      const response = await axios.put(
        `/api/rentalPayments/${rentalpayment.id}`,
        JSON.stringify(rentalpayment),
        config
      );

      console.log("Response:", response.data);

      return response.data;
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteRentalPayment = async (rentalPayment: RentalPayment) => {
    try {
      const config = {
        headers: {},
      };
      const response = await axios.delete(
        `/api/rentalPayments/${rentalPayment.id}`,
        config
      );

      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getRentalPayment = async (id: number) => {
    let url = `/api/rentalPayments/${id}`;

    const response = await fetch(url);

    rentalPayment.value = await response.json();
  };

  const getRentalPayments = async (property: string, year?: string) => {
    if (year != undefined && year != null) {
      const response = await fetch(
        "/rentalPayments/getByProperty/" + property + "/" + year
      );
      rentalPayments.value = await response.json();
    } else {
      const response = await fetch("/rentalPayments/getByProperty/" + property);
      rentalPayments.value = await response.json();
    }
  };

  const getTypes = async (type: string) => {
    const response = await fetch("/rentalPayments/type/" + type);
    types.value = await response.json();
  };

  return {
    rentalPayments,
    addRentalPayment,
    updateRentalPayment,
    deleteRentalPayment,
    getRentalPayments,
    getTypes,
    getRentalPayment,
  };
});
