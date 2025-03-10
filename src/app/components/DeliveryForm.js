"use client"

// components/DeliveryForm.js
import { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { app } from "../../../Firebase"; // Import Firebase app
import * as XLSX from "xlsx"; // Import xlsx library for exporting Excel files

const db = getFirestore(app); // Initialize Firestore

const provinces = [
  "Kompong Speu", "Siem Reap", "Battambang", "Kompong Cham", 
  "Prey Veng", "Kompong Thom", "Kompong Chnang", "Banteaymeanchey", 
  "Rathanakiri", "Preah Vihear", "Kompong Som", "Svay Rieng", 
  "Kompot", "Tbong Khmum", "Takeo", "Phnom Penh"
];

// Truck number to phone number mapping
const truckToPhoneMapping = {
  "1170": "016551170",
  "9987": "015654894",
  "0068": "016920299",
  "0062": "098263915",
  "0733": "0966507486",
  "8764": "016423623",
  "5450": "015508786",
};

const DeliveryForm = () => {
  const [province, setProvince] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [truckNumber, setTruckNumber] = useState(""); // Initially no truck number selected
  const [name, setName] = useState("Mr. Rathana"); // Default name
  const [phone, setPhone] = useState(""); // Automatically set phone based on truck number
  const [invoice, setInvoice] = useState(""); // Invoice number
  const [quantity, setQuantity] = useState(""); // Quantity input
  const [rate, setRate] = useState(0); // Rate based on province
  const [total, setTotal] = useState(0); // Calculated total (quantity * rate)
  
  // Array to hold all delivery notes (persisted in Firestore)
  const [deliveryNotes, setDeliveryNotes] = useState([]);

  useEffect(() => {
    // Fetch all delivery notes from Firestore on component mount
    const fetchDeliveryNotes = async () => {
      const querySnapshot = await getDocs(collection(db, "deliveryNotes"));
      const notes = querySnapshot.docs.map((doc) => doc.data());
      setDeliveryNotes(notes);
    };

    fetchDeliveryNotes();
  }, []);

  // Set rate and total based on province selection
  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setProvince(selectedProvince);

    // Example: Set rate based on selected province
    let newRate = 0;
    if (selectedProvince === "Kompong Speu") {
      newRate = 0.18; 
    } else if (selectedProvince === "Siem Reap") {
      newRate = 0.38;
    } else if (selectedProvince === "Battambang") {
      newRate = 0.38; 
    } else if (selectedProvince === "Kompong Cham") {
      newRate = 0.22; 
    } else if (selectedProvince === "Prey Veng") {
      newRate = 0.20; 
    } else if (selectedProvince === "Kompong Thom") {
      newRate = 0.25; 
    } else if (selectedProvince === "Kompong Chnang") {
      newRate = 0.25; 
    } else if (selectedProvince === "Banteaymeanchey") {
      newRate = 0.43; 
    } else if (selectedProvince === "Rathanakiri") {
      newRate = 0.75; 
    } else if (selectedProvince === "Preah Vihear") {
      newRate = 0.45; 
    } else if (selectedProvince === "Kompong Som") {
      newRate = 0.35; 
    } else if (selectedProvince === "Svay Rieng") {
      newRate = 0.25; 
    } else if (selectedProvince === "Kompot") {
      newRate = 0.25; 
    } else if (selectedProvince === "Tbong khmum") {
      newRate = 0.23; 
    } else if (selectedProvince === "Takeo") {
      newRate = 0.20; 
    }
    setRate(newRate);
    setTotal(quantity * newRate); // Automatically update total
  };

  // Automatically set total when quantity or rate changes
 // Automatically set total when quantity or rate changes
const handleQuantityChange = (e) => {
  let value = e.target.value;
  // Remove leading zeros for quantity
  value = value.replace(/^0+/, "");
  setQuantity(value);

  // Round the total (quantity * rate) to two decimal places
  const calculatedTotal = (value * rate).toFixed(2); // Round to 2 decimal places
  setTotal(calculatedTotal); // Update the total
};


  // Function to generate phone number based on truck number
  const handleTruckNumberChange = (e) => {
    const selectedTruckNumber = e.target.value;
    setTruckNumber(selectedTruckNumber);
    setPhone(truckToPhoneMapping[selectedTruckNumber] || ""); // Set phone based on truck number mapping
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newDeliveryNote = {
      truckNumber,
      name,
      phone,
      invoice,
      province,
      quantity,
      rate,
      total,
      deliveryDate,
      date: new Date().toISOString(),
    };

    try {
      // Add new delivery note to Firestore
      await addDoc(collection(db, "deliveryNotes"), newDeliveryNote);
      alert("Delivery note saved successfully!");

      // Add the new note to the local state to accumulate the data
      setDeliveryNotes((prevNotes) => [...prevNotes, newDeliveryNote]);

      // Reset form after successful submission
      setTruckNumber("");
      setProvince("");
      setDeliveryDate("");
      setName("Mr. Rathana");
      setPhone("");
      setInvoice("");
      setQuantity("");
      setRate(0);
      setTotal(0);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // Function to format date in dd-mmm-yyyy format
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  // Function to export all collected data to Excel
  const exportToExcel = () => {
    // Create an array for the header row
    const header = ["Province", "Delivery Date", "Truck Number", "Name", "Phone", "Invoice", "Quantity", "Rate", "Total"];

    // Prepare data for Excel export
    const data = deliveryNotes
      .sort((a, b) => a.province.localeCompare(b.province)) // Sort by province
      .map((note) => [
        note.province,
        formatDate(note.deliveryDate), // Format the delivery date
        note.truckNumber,
        note.name,
        note.phone,
        note.invoice,
        note.quantity,
        note.rate,
        note.total,
      ]);

    // Add header to data
    const exportData = [header, ...data];

    // Create and download Excel file
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Delivery Notes");
    XLSX.writeFile(wb, "delivery_notes.xlsx");
  };

  return (
    <div className="form-container">
      <h2>Delivery Note Input</h2>
      <form onSubmit={handleSubmit}>
        <select value={province} onChange={handleProvinceChange} required>
          <option value="">ខេត្ត</option>
          {provinces.map((province, index) => (
            <option key={index} value={province}>
              {province}
            </option>
          ))}
        </select>

        <input
          type="date"
          placeholder="Delivery Date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          required
        />

        <select value={truckNumber} onChange={handleTruckNumberChange} required>
          <option value="">លេខឡាន</option>
          {Object.keys(truckToPhoneMapping).map((truckNumber, index) => (
            <option key={index} value={truckNumber}>
              {truckNumber}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Phone"
          value={phone}
          readOnly
        />

        <input
          type="text"
          placeholder="លេខ Dn"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="ចំនួន"
          value={quantity}
          onChange={handleQuantityChange}
          required
        />

        <input
          type="number"
          placeholder="Rate"
          value={rate}
          readOnly
        />

        <input
          type="number"
          placeholder="Total"
          value={total}
          readOnly
        />

        <button type="submit">Save</button>
      </form>

      <button onClick={exportToExcel} >Export to Excel</button>
    </div>
  );
};

export default DeliveryForm;
