/**
     * Nama Program: GODONG POS - Kasir Reorder
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 8 Jan 2024
     * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas Reorder Kasir
    - Read
*/
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
// import TabelSkaleton from '../../../../component/tabel/skaleton';
import { useRouter } from 'next/router';

import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import { showError } from '../../../component/GeneralFunction/GeneralFunction';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembelian/purchase-order');
    if (sessionData?.redirect) {
        return sessionData;
    }
    // const { id } = context.params;
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};
export default function Reorder({ supplierKode, reorderDialog, setReorderDialog, btnReorder, addPo, setAddPo, calculateUpdatedGrandTotalDisc, po, setPo }) {
    const apiEndPointGetReorder = '/api/purchase_order/reorder';
    const apiEndPointGetReorderByFaktur = '/api/purchase_order/getdata_reorder';

    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [addPoTabel, setAddPoTabel] = useState([]);
    const [addPoTabelFilt, setAddPoTabelFilt] = useState([]);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const op = useRef(null);
    const onPage = (event) => {
        setlazyState(event);
    };
    useEffect(() => {
        if (reorderDialog && btnReorder) {
            toggleReorder();
        }
    }, [btnReorder, lazyState]);

    const toggleReorder = async () => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGetReorder, lazyState);
            const json = vaTable.data;
            setAddPoTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };
    const onRowSelectReorder = async (event) => {
        const selectedSupplier = event.data.SUPPLIER;
        let requestBody = {
            SUPPLIER: selectedSupplier
        };
        // return;
        try {
            const vaTable = await postData(apiEndPointGetReorderByFaktur, requestBody);
            const json = vaTable.data.data;
            // return;
            // setPo(json);
            setPo((prevPo) => ({
                ...prevPo,
                SUPPLIER: event.data.SUPPLIER,
                NAMA: json.SUPPLIER,
                ALAMAT: json.ALAMAT,
                QTY: json.QTY
            }));
            dataFuncCalculate(json);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }

        setReorderDialog(false);
    };

    const dataFuncCalculate = async (json) => {
        const detail = json.detail;
        let _data = [...detail];
        // return;
        const funcCalculateArray = [];
        for (let i = 0; i < _data.length; i++) {
            const data = _data[i];
            const ketAsal = 'dataReorder';
            const funcCalculate = await calculateUpdatedGrandTotalDisc(data, null, null, null, ketAsal);
            funcCalculateArray.push(funcCalculate);
        }

        // Set addItem setelah semua perhitungan selesai
        setAddPo(() => {
            const updatedAddItem = _data.map((data, index) => {
                const funcCalc = funcCalculateArray[index];
                // const qtyToUse = data.QTY !== 0 ? data.QTY : funcCalc.updatedQTY;
                const qtyToUse = 0;
                return {
                    KODE: data.KODE,
                    DISCOUNT: data.DISCOUNT,
                    BARCODE: data.BARCODE,
                    NAMA: data.NAMA,
                    QTY: qtyToUse,
                    // QTY: funcCalc.updatedQTY,
                    SATUAN: data.SATUAN,
                    HARGABELI: data.HARGABELI,
                    SUBTOTAL: funcCalc.subTotal,
                    HARGADISCQTY: funcCalc.totDiscQty,
                    HARGAPPNQTY: funcCalc.totPpnQty,
                    GRANDTOTAL: funcCalc.updatedGrandTotalDisc
                };
            });
            return updatedAddItem;
        });
    };

    const [closingDialog, setClosingDialog] = useState(false);
    const closingDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setClosingDialog(false)} />
            {/* <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={saveReorder} /> */}
        </>
    );
    const onHideDialog = () => {
        setlazyState((prevState) => ({
            ...prevState,
            filters: {}
        }));
        setReorderDialog(false);
    };
    const [timer, setTimer] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);

    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'SUPPLIER', label: 'KODE SUPPLIER' }
        // { name: "NAMA", label: "NAMA" }
    ];

    useEffect(() => {
        setAddPoTabelFilt(addPoTabel);
    }, [addPoTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = addPoTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.SUPPLIER) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = addPoTabel;
            } else {
                filtered = addPoTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setAddPoTabelFilt(filtered);
    };
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" />
                &nbsp; */}
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    {/* <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." /> */}
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    return (
        <div className="grid crud-demo">
            <Toast ref={toast} />
            <Dialog visible={reorderDialog} style={{ width: '95%' }} header="Reorder" modal className="p-fluid" onHide={onHideDialog}>
                <hr />
                <DataTable
                    value={addPoTabelFilt}
                    header={header}
                    filters={lazyState.filters}
                    first={first} // Menggunakan nilai halaman pertama dari state
                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                    paginator
                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                    totalRecords={totalRecords} // Total number of records
                    size="small"
                    loading={loading}
                    emptyMessage="Data Kosong"
                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                    onRowSelect={onRowSelectReorder}
                    selectionMode="single"
                >
                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="SUPPLIER" header="KODE SUPPLIER"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="ALAMAT" header="ALAMAT"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="TELEPON" header="TELEPON"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="NAMA_CP_1" header="NAMA CONTACT PERSON"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="TELEPON_CP_1" header="TELEPON CONTACT PERSON"></Column>
                    {/* <Column headerStyle={{ textAlign: "center" }} field="MINSTOCK" header="MINSTOCK"></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="REORDER" header="REORDER"></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="TGL" header="TANGGAL" body={(rowData) => formatDateTable(rowData.TGL)}></Column> */}
                </DataTable>
            </Dialog>
            {/* -----------------------------------------------------------------------------------------< DIALOG VALIDASI CLOSING > */}
            <Dialog visible={closingDialog} header="Confirm" modal footer={closingDialogFooter} onHide={() => setClosingDialog(false)}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Yakin ingin Reorder ?</span>
                </div>
            </Dialog>
        </div>
    );
}
