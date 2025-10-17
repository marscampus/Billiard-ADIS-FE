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
 * Created on Mon Aug 05 2024 - 09:02:16
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import React, { useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { convertToISODate, formatAndSetDate, formatDate } from '../../../component/GeneralFunction/GeneralFunction';
import { Button } from 'primereact/button';
import postData from '../../../lib/Axios';
import { Calendar } from 'primereact/calendar';
import { startOfMonth } from 'date-fns';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function PostingJurnal() {
    const apiEndPointPostingTransaksi = '/api/posting/jurnal';
    const toast = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const handleData = async () => {
        setIsLoading(true);
        try {
            let requestBody = {
                TglAwal: convertToISODate(startDate),
                TglAkhir: convertToISODate(endDate)
            };
            const vaData = await postData(apiEndPointPostingTransaksi, requestBody);
            showSuccess(vaData.data.message);
        } catch (error) {
            console.log(error);

            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    //  Yang Handle Inputan Tanggal
    const handleStartDate = (e) => {
        setStartDate(e.value);
    };

    const handleStartDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setStartDate);
    };

    const handleEndDate = (e) => {
        setEndDate(e.value);
    };

    const handleEndDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setEndDate);
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="mr-5">Periode Posting :</div>
                {isLoading ? (
                    <div>
                        <div>
                            <i className="pi pi-spinner pi-spin" style={{ fontSize: '1.5em', marginRight: '8px' }} />
                            <span style={{ marginLeft: '3px' }}>Loading...</span>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <span>
                                Proses sedang berlangsung. Mohon tunggu hingga proses selesai.<br></br>
                                Harap tidak menutup atau memuat ulang halaman ini.
                            </span>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* <strong>{tgl ? formatDate(tgl) : '-'}</strong> */}
                        <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} dateFormat="dd-mm-yy" showIcon />
                        <label style={{ margin: '5px' }}>s.d</label>
                        <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} dateFormat="dd-mm-yy" showIcon />
                    </div>
                )}
            </React.Fragment>
        );
    };

    const handleProsesClick = async () => {
        await handleData();
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>Posting Jurnal</h4>
                <hr></hr>
                <Toast ref={toast}></Toast>
                <div className="mb-3">
                    <p className="mb-1">Proses Posting Akan Melakukan Proses :</p>
                    <div className="formgrid grid">
                        <div className="field col-12 lg:col-4">
                            <p className="ml-3 mb-1">1. Posting Transaksi Sewa Kamar</p>
                        </div>
                    </div>
                </div>
                <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button label="Proses" className="p-button-primary mr-2" disabled />
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button label="Proses" className="p-button-primary mr-2" onClick={handleProsesClick} />
                    </div>
                )}
            </div>
        </div>
    );
}
