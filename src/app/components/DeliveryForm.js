"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { app } from "../../../Firebase";
import * as XLSX from "xlsx";

const db = getFirestore(app);

const provinces = [
  "Kompong Speu", "Siem Reap", "Battambang", "Kompong Cham",
  "Prey Veng", "Kompong Thom", "Kompong Chnang", "Banteaymeanchey",
  "Rathanakiri", "Preah Vihear", "Kompong Som", "Svay Rieng",
  "Kompot", "Tbong Khmum", "Takeo", "Kratie"
];

const companies = ["TSNR", "ROYAL", "CK"];

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
  const [truckNumber, setTruckNumber] = useState("");
  const [name, setName] = useState("Mr. Rathana");
  const [phone, setPhone] = useState("");
  const [invoice, setInvoice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState(0);
  const [total, setTotal] = useState(0);
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [company, setCompany] = useState("");

  useEffect(() => {
    const fetchDeliveryNotes = async () => {
      if (!company) return;
      const collectionName = `deliveryNotes_${company.toLowerCase()}`;
      const querySnapshot = await getDocs(collection(db, collectionName));
      const notes = querySnapshot.docs.map((doc) => doc.data());
      setDeliveryNotes(notes);
    };

    fetchDeliveryNotes();
  }, [company]);

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setProvince(selectedProvince);

    let newRate = 0;
    const rateTable = {
      "Kompong Speu": 0.18,
      "Siem Reap": 0.38,
      "Battambang": 0.38,
      "Kompong Cham": 0.22,
      "Prey Veng": 0.20,
      "Kompong Thom": 0.25,
      "Kompong Chnang": 0.25,
      "Banteaymeanchey": 0.43,
      "Rathanakiri": 0.75,
      "Preah Vihear": 0.45,
      "Kompong Som": 0.35,
      "Svay Rieng": 0.25,
      "Kompot": 0.25,
      "Tbong Khmum": 0.23,
      "Takeo": 0.20,
      "Kratie": 0.45,
    };

    newRate = rateTable[selectedProvince] || 0;
    setRate(newRate);
    setTotal(quantity * newRate);
  };

  const handleQuantityChange = (e) => {
    let value = e.target.value.replace(/^0+/, "");
    setQuantity(value);
    const calculatedTotal = (value * rate).toFixed(2);
    setTotal(calculatedTotal);
  };

  const handleTruckNumberChange = (e) => {
    const selectedTruckNumber = e.target.value;
    setTruckNumber(selectedTruckNumber);
    setPhone(truckToPhoneMapping[selectedTruckNumber] || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!company) {
      alert("សូមជ្រើសរើសក្រុមហ៊ុន");
      return;
    }

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
      const collectionName = `deliveryNotes_${company.toLowerCase()}`;
      await addDoc(collection(db, collectionName), newDeliveryNote);
      alert("ជោគជ័យ!");
      setDeliveryNotes((prevNotes) => [...prevNotes, newDeliveryNote]);

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
      console.error("ព្យាយាមម្តងទៀត ", error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  const exportSelectedCompanyToExcel = async () => {
    if (!company) {
      alert("សូមជ្រើសរើសក្រុមហ៊ុន");
      return;
    }

    const collectionName = `deliveryNotes_${company.toLowerCase()}`;
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const notes = querySnapshot.docs.map((doc) => doc.data());

      if (notes.length === 0) {
        alert("គ្មានទិន្នន័យសម្រាប់ក្រុមហ៊ុននេះទេ។");
        return;
      }

      const header = [
        "Province",
        "Delivery Date",
        "Truck Number",
        "Name",
        "Phone",
        "Invoice",
        "Quantity",
        "Rate",
        "Total",
      ];

      const data = notes.map((note) => [
        note.province,
        formatDate(note.deliveryDate),
        note.truckNumber,
        note.name,
        note.phone,
        note.invoice,
        note.quantity,
        note.rate,
        note.total,
      ]);

      const exportData = [header, ...data];
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${company} Delivery Notes`);
      XLSX.writeFile(wb, `${company.toLowerCase()}_delivery_notes.xlsx`);

      alert(`បានបង្ហោះ Excel សម្រាប់ ${company} ជោគជ័យ`);
    } catch (error) {
      console.error("បញ្ហា​ក្នុងការបង្ហោះ Excel:", error);
      alert("បង្ហោះបរាជ័យ សូមព្យាយាមម្ដងទៀត");
    }
  };

  return (
    <div className="form-container">
      <h2>Delivery Note Input</h2>
      <form onSubmit={handleSubmit}>
        <select value={company} onChange={(e) => setCompany(e.target.value)} required>
          <option value="">ជ្រើសរើសក្រុមហ៊ុន</option>
          {companies.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>

        <select value={province} onChange={handleProvinceChange} required>
          <option value="">ខេត្ត</option>
          {provinces.map((province, index) => (
            <option key={index} value={province}>{province}</option>
          ))}
        </select>

        <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
        <select value={truckNumber} onChange={handleTruckNumberChange} required>
          <option value="">លេខឡាន</option>
          {Object.keys(truckToPhoneMapping).map((truckNumber, index) => (
            <option key={index} value={truckNumber}>{truckNumber}</option>
          ))}
        </select>

        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="text" placeholder="Phone" value={phone} readOnly />
        <input type="text" placeholder="លេខ Dn" value={invoice} onChange={(e) => setInvoice(e.target.value)} required />
        <input type="number" placeholder="ចំនួន" value={quantity} onChange={handleQuantityChange} required />
        <input type="number" placeholder="Rate" value={rate} readOnly />
        <input type="number" placeholder="Total" value={total} readOnly />
        <button type="submit">Save</button>
      </form>

      <button onClick={exportSelectedCompanyToExcel}>Export to Excel</button>
    </div>
  );
};

export default DeliveryForm;
