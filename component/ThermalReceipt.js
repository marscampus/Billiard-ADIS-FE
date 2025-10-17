/*
 * Copyright (C) Godong
 *http://www.marstech.co.id
 *Email. info@marstech.co.id
 *Telp. 0811-3636-09
 *Office        : Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118
 *Branch Office : Perum Griya Gadang Sejahtera Kav. 14 Gadang - Sukun - Kota Malang - Jawa Timur
 *
 *Godong
 *Adalah merek dagang dari PT. Marstech Global
 *
 *License Agreement
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu aset perusahaan yang bernilai.
 *Di Indonesia secara khusus,
 *software telah dianggap seperti benda-benda berwujud lainnya yang memiliki kekuatan hukum.
 *Oleh karena itu pemilik software berhak untuk memberi ijin atau tidak memberi ijin orang lain untuk menggunakan softwarenya.
 *Dalam hal ini ada aturan hukum yang berlaku di Indonesia yang secara khusus melindungi para programmer dari pembajakan software yang mereka buat,
 *yaitu diatur dalam hukum hak kekayaan intelektual (HAKI).
 *
 *********************************************************************************************************
 *Pasal 72 ayat 3 UU Hak Cipta berbunyi,
 *' Barangsiapa dengan sengaja dan tanpa hak memperbanyak penggunaan untuk kepentingan komersial '
 *' suatu program komputer dipidana dengan pidana penjara paling lama 5 (lima) tahun dan/atau '
 *' denda paling banyak Rp. 500.000.000,00 (lima ratus juta rupiah) '
 *********************************************************************************************************
 *
 *Proprietary Software
 *Adalah software berpemilik, sehingga seseorang harus meminta izin serta dilarang untuk mengedarkan,
 *menggunakan atau memodifikasi software tersebut.
 *
 *Commercial software
 *Adalah software yang dibuat dan dikembangkan oleh perusahaan dengan konsep bisnis,
 *dibutuhkan proses pembelian atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Mon Aug 19 2024 - 08:59:04
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import jsPDF from 'jspdf';
import { useEffect, useState } from 'react';
import { getDBConfig } from './GeneralFunction/GeneralFunction';

function ThermalReceipt({ data }) {
    const [pdfDataUrlA4, setPdfDataUrlA4] = useState('');
    const [pdfDataUrlThermal, setPdfDataUrlThermal] = useState('');

    useEffect(() => {
        if (data) {
            generatePDF('thermal');
        }
    }, [data]);

    const generatePDF = async (version, data) => {
        if (!data) {
            // Jika data tidak ada tampilkan TOAST
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: version === 'a4' ? 'a4' : [80, 297]
        });

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const yOffsetForm = 25;
        const lineHeightForm = 4;

        // Mulai mencetak
        const drawSeparator = (yPos) => {
            doc.setLineDashPattern([1, 1], 0);
            doc.setLineWidth(0.1);
            doc.setDrawColor(0, 0, 0);
            doc.line(5, yPos, pageWidth - 5, yPos);
        };
        // Header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(await getDBConfig('namaPerusahaan'), pageWidth / 2, yPos, { align: 'center' });
        doc.text(await getDBConfig('almatPerusahaan'), pageWidth / 2, yPos + 5, { align: 'center' });
        yPos += 20;
        // Garis Pemisah
        drawSeparator(21);
        // Info Kasir
        doc.setFontSize(10);
        const dataGrid = [
            {
                label: data.Faktur,
                value: data.kasir + '-' + data.DateTime
            }
        ];
        dataGrid.forEach((item, index) => {
            const yPosition = yOffsetForm + index * lineHeightForm;
            doc.text(item.label.toString(), labelXPosition, yPosition);
            doc.text(item.value.toString(), valueXPosition + 5, yPosition);
        });

        drawSeparator(30);

        let startY = 32;
        let overallTotal = 0;
        // List Barang
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc;
    };
}
