/**
     * Nama Program: GODONG POS - Pembelian - Penerimaan Barang tanpa Faktur PO
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 19 Maret 2024
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Add Data Penerimaan Barang tanpa Faktur PO
*/
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { formatDateSave, formatRibuan, formatTglExpired } from '../../../../component/GeneralFunction/GeneralFunction';
import Gudang from '../../../component/gudang';
import Supplier from '../../../component/supplier';

import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import Produk from '../../../component/produk';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembelian/penerimaan-barang');
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
function MasterAddPembelian() {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetListProduk = '/api/produk/get-filter';
    const apiEndPointGetFaktur = '/api/pembelian/get_faktur';
    const apiEndPointGetDataEdit = '/api/pembelian/getdata_edit';

    const apiEndPointGetBarcode = '/api/produk/get-barcode';
    const apiEndPointStore = '/api/pembelian/store';
    const apiEndPointUpdate = '/api/pembelian/update';

    const router = useRouter();
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [loadingBarcode, setLoadingBarcode] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [addPembelian, setAddPembelian] = useState([]);
    const [pembelian, setPembelian] = useState([]);
    const [pageTitle, setPageTitle] = useState('New Purchase Order');
    const [statusAction, setStatusAction] = useState(null);
    const [isFormReadOnly, setIsFormReadOnly] = useState(false);
    const [searchBarcode, setSearchBarcode] = useState('');
    const [keteranganAlamat, setKeteranganAlamat] = useState('');
    const [keteranganKota, setKeteranganKota] = useState('');

    const [kodeError, setKodeError] = useState('');
    const [keteranganError, setKeteranganError] = useState('');

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [lazyStateBarcode, setlazyStateBarcode] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [{ field: 'Loading...', header: 'Loading...' }];

    const op = useRef(null);

    const onPage = (event) => {
        setlazyState(event);
    };

    const [expired, setExpired] = useState(null);
    const getExpired = () => {
        const currentDate = new Date();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();
        const valExpired = `${month}-${year}`;
        setExpired(valExpired);
        return valExpired;
    };
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);

    const [faktur, setFaktur] = useState(null);

    useEffect(() => {
        const { status } = router.query;
        const FAKTUR = localStorage.getItem('FAKTUR');
        if (status === 'update') {
            setFaktur(FAKTUR);
            fetchDataForEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true); // Set state isUpdateMode to true
        } else {
            loadLazyData();
            setIsUpdateMode(false); // Set state isUpdateMode to false
        }
    }, [router.query]);

    // useEffect(() => {
    //     if (!isUpdateMode) { // Menambahkan kondisi untuk hanya memuat data jika tidak dalam mode update dan data PO belum dimuat
    //         loadLazyData();
    //     }
    // }, [isUpdateMode]); // Menambahkan state po ke dalam dependency array

    useEffect(() => {
        // Untuk checkbox PPN
        if (pembelian.PPN > 0) {
            setCheckedPpn(true);
        } else {
            setCheckedPpn(false);
        }
        // Untuk checkbox diskon
        if (pembelian.PERSDISC > 0) {
            setChecked(true);
        } else {
            setChecked(false);
        }
    }, [pembelian.PPN, pembelian.PERSDISC]);

    // useEffect(() => {
    // 	const { status } = router.query;
    // 	if (status === "update") {
    // 		fetchDataForEdit();
    // 		setReadOnlyEdit(true);
    //         setIsUpdateMode(true);
    // 	} else {
    // 		loadLazyData();
    // 		setReadOnlyEdit(false);
    //         setIsUpdateMode(false);
    // 	}
    // }, [router.query]);

    // useEffect(() => {
    // 	loadLazyData();
    // }, [lazyState]);

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    // -----------------------------------------------------------------------------------------------------------------< FAKTUR >
    const displayValue = isUpdateMode ? pembelian.FAKTUR : faktur;
    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                KODE: 'PB',
                LEN: 6
            }; const vaTable = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setFaktur(json);
            setPembelian((prevPembelian) => ({
                ...prevPembelian,
                FAKTUR: json
            }));
        } catch (error) {
            console.log('Error while loading data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierKode, setSupplierKode] = useState('');
    const [supplierNama, setSupplierNama] = useState('');
    const [supplierAlamat, setSupplierAlamat] = useState('');
    const btnSupplier = () => {
        setSupplierDialog(true);
    };
    const handleSupplierData = (supplierKode, supplierNama, supplierAlamat) => {
        setSupplierKode(supplierKode);
        setSupplierNama(supplierNama);
        setSupplierAlamat(supplierAlamat);
    };

    // -----------------------------------------------------------------------------------------------------------------< Gudang >
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState('');
    const [gudangKet, setGudangKet] = useState('');
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setGudangKode(gudangKode);
        setGudangKet(gudangKet);
        setPembelian((prevPembelian) => ({
            ...prevPembelian,
            GUDANG: gudangKode
        }));
    };

    //   ------------------------------------------------------------------------------------------------------------------- < Checked PPN >
    const [checkedPpn, setCheckedPpn] = useState(false);
    const onCheckboxPpnChange = (event) => {
        const isChecked = event.target.checked;
        setCheckedPpn(isChecked);
        if (isChecked) {
            setPembelian({ ...pembelian, PPN: 11, ketPpn: 'adaAllPpnKolektif' }); // Ketika checkbox dicentang, atur setPembelian PERSDISC dan ketAsal menjadi "adaAllDiscKolektif"
        } else {
            setPembelian({ ...pembelian, PPN: 0, ketPpn: 'tanpaAllPpnKolektif' }); // Jika checkbox tidak dicentang, atur setPembelian PERSDISC menjadi 0 dan ketAsal kosong
        }
    };

    //   ------------------------------------------------------------------------------------------------------------------- < Checked Disc and Func>
    const [checked, setChecked] = useState(false);
    const onCheckboxChange = (event) => {
        setChecked(event.target.checked);
        // if (!event.target.checked) {
        //     setPembelian({ PERSDISC: 0 }); // Ketika checkbox dimatikan, setPembelian PERSDISC menjadi 0
        // }
        if (event.target.checked) {
            setPembelian({ ...pembelian, PERSDISC: pembelian.PERSDISC, ketDisc: 'adaAllDiscKolektif' }); // Ketika checkbox dicentang, atur setPembelian PERSDISC dan ketAsal menjadi "adaAllDiscKolektif"
        } else {
            setPembelian({ ...pembelian, PERSDISC: 0, ketDisc: 'tanpaAllDiscKolektif' }); // Jika checkbox tidak dicentang, atur setPembelian PERSDISC menjadi 0 dan ketAsal kosong
        }
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _pembelian = { ...pembelian };
        _pembelian[`${name}`] = val;
        setPembelian(_pembelian);
    };
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...pembelian };
        _data[`${name}`] = val;
        setPembelian(_data);
    };
    // -----------------------------------------------------------------------------------------------------------------< Hide Dialog >
    const setNull = () => {
        setPembelian({
            FAKTUR: ''
        });
        setKeteranganSupplier('');
        setKeteranganAlamat('');
        setKeteranganKota('');
        setAddPembelian([]);
    };
    const hideDialog = () => {
        setSubmitted(false);
        setAddPembelianDialog(false);
    };
    const hideBarcode = () => {
        setlazyStateBarcode((prevState) => ({
            ...prevState,
            filters: {}
        }));
        setBarcodeDialog(false);
    };

    // -----------------------------------------------------------------------------------------------------------< Barcode >
    const [barcodeTabel, setBarcodeTabel] = useState([]);
    const [barcodeDialog, setBarcodeDialog] = useState(false);
    const btnProduk = () => {
        setBarcodeDialog(true);
    };
    const handleProdukData = (dataProduk) => {
        onRowSelectBarcode({ data: dataProduk });
    };

    const calculateUpdatedGrandTotalDisc = (addedData, qtyToAdd, editedQty, editedDisc, ketAsal, editHargaBeli, editNominalDisc, editNominalPpn) => {
        let updatedQTY;
        let disc;
        let ppn;
        let hargaDisc;
        let totDiscQty;
        let totPpnQty;
        let hargaBeli;
        let hargaPpn;
        if (ketAsal == 'firstEnter') {
            // -------------------------------------> 1
            updatedQTY = qtyToAdd;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'firstBonus') {
            // -------------------------------------> Bonus 1 dg Barcode yang sama dg dari faktur
            updatedQTY = qtyToAdd;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'existInTable') {
            // -------------------------------------> QTY di Tabel + 1 (exist sebelumnya)
            updatedQTY = addedData.QTY + qtyToAdd;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'editQTYFromTable') {
            // -------------------------------------> QTY sesuai edit in cell
            updatedQTY = editedQty;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'editHargaBeliFromTable') {
            // -------------------------------------> HB sesuai edit in cell
            updatedQTY = addedData.TERIMA;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = editHargaBeli;
        } else if (ketAsal == 'editDiscFromTable') {
            // -------------------------------------> Disc di tabel - editDiscFromTable
            updatedQTY = addedData.TERIMA;
            totDiscQty = editNominalDisc;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'editPpnFromTable') {
            // -------------------------------------> Ppn di tabel - editPpnFromTable
            updatedQTY = addedData.TERIMA;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = editNominalPpn;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'dataEdit') {
            // -------------------------------------> Dari FakturPo
            updatedQTY = addedData.TERIMA;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else {
            // -------------------------------------> Dari FakturPo dataFakturPo
            updatedQTY = addedData.TERIMA;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        }
        // return;
        const subtotal = updatedQTY * hargaBeli; // -------< Total SEBELUM Disc >
        console.log(addedData);

        const updatedGrandTotalDisc = subtotal - parseFloat(totDiscQty) + parseFloat(totPpnQty);

        return { updatedGrandTotalDisc, hargaDisc, subtotal, disc, updatedQTY, hargaPpn, ppn, totDiscQty, totPpnQty, hargaBeli };
    };

    const calculateUpdatedGrandTotalDisc1 = (addedData, qtyToAdd, editedQty, editedDisc, ketAsal, editHargaBeli, editNominalDisc, editNominalPpn) => {
        let updatedQTY;
        let disc;
        let ppn;
        let hargaDisc;
        let totDiscQty;
        let totPpnQty = 0;
        let hargaBeli;
        let hargaPpn;
        const kondisiAdaEditNominalDisc = addedData.DISCOUNT !== null;
        const kondisiAdaEditNominalPpn = addedData.PPN !== null;
        const kondisiAdaEditNominalHargaBeli = addedData.HARGABELI !== null;
        if (ketAsal == 'firstEnter') {
            // -------------------------------------> 1
            updatedQTY = qtyToAdd;
            hargaBeli = addedData.HARGABELI;
            if (pembelian.ketDisc == 'adaAllDiscKolektif') {
                disc = pembelian.PERSDISC / 100;
            } else {
                disc = addedData.DISCOUNT / 100;
            }
            hargaDisc = hargaBeli * disc;
            totDiscQty = hargaDisc * updatedQTY;

            if (pembelian.ketPpn == 'adaAllPpnKolektif') {
                ppn = pembelian.PPN / 100;
            } else {
                ppn = addedData.PPN / 100;
            }
            hargaPpn = hargaBeli * ppn;
            totPpnQty = hargaPpn * updatedQTY;
        } else if (ketAsal == 'existInTable') {
            // -------------------------------------> QTY di Tabel + 1 (exist sebelumnya)
            updatedQTY = addedData.TERIMA + qtyToAdd;
            hargaBeli = addedData.HARGABELI;
            if (pembelian.ketDisc == 'adaAllDiscKolektif') {
                disc = pembelian.PERSDISC / 100;
            } else {
                disc = addedData.DISCOUNT / 100;
            }
            hargaDisc = hargaBeli * disc;
            totDiscQty = hargaDisc * updatedQTY;
            if (pembelian.ketPpn == 'adaAllPpnKolektif') {
                ppn = pembelian.PPN / 100;
            } else {
                ppn = addedData.PPN / 100;
            }
            hargaPpn = hargaBeli * ppn;
            totPpnQty = hargaPpn * updatedQTY;
        } else if (ketAsal == 'editQTYFromTable') {
            // -------------------------------------> sesuai edit QTY in cell
            updatedQTY = editedQty;
            hargaBeli = addedData.HARGABELI;
            if (pembelian.ketDisc == 'adaAllDiscKolektif') {
                disc = pembelian.PERSDISC / 100;
            } else {
                disc = addedData.DISCOUNT / 100;
            }
            hargaDisc = hargaBeli * disc;
            if (kondisiAdaEditNominalDisc) {
                if (pembelian.ketDisc == 'adaAllDiscKolektif') {
                    totDiscQty = hargaDisc * updatedQTY;
                } else {
                    totDiscQty = addedData.DISCOUNT;
                }
            } else {
                totDiscQty = hargaDisc * updatedQTY;
            }
            if (pembelian.ketPpn == 'adaAllPpnKolektif') {
                ppn = pembelian.PPN / 100;
            } else {
                ppn = addedData.PPN / 100;
            }
            hargaPpn = hargaBeli * ppn;
            if (kondisiAdaEditNominalPpn) {
                if (pembelian.ketPpn == 'adaAllPpnKolektif') {
                    totPpnQty = hargaPpn * updatedQTY;
                } else {
                    totPpnQty = addedData.PPN;
                }
            } else {
                totPpnQty = hargaPpn * updatedQTY;
            }
        } else if (ketAsal == 'editHargaBeliFromTable') {
            // -------------------------------------> Harga Beli di tabel - editHargaBeliFromTable
            if (kondisiAdaEditNominalHargaBeli) {
                hargaBeli = editHargaBeli;
            } else {
                hargaBeli = addedData.HARGABELI;
            }
            updatedQTY = addedData.TERIMA;
            if (pembelian.ketDisc == 'adaAllDiscKolektif') {
                disc = pembelian.PERSDISC / 100;
            } else {
                disc = addedData.DISCOUNT / 100;
            }
            hargaDisc = hargaBeli * disc;
            // if (kondisiAdaEditNominalDisc) {
            // 	totDiscQty = addedData.DISCOUNT; // Gunakan editNominalDisc jika ada
            // } else {
            totDiscQty = hargaDisc * updatedQTY; // Hitung nilai jika editNominalDisc tidak ada
            // }
            // ppn = addedData.PPN / 100;
            if (pembelian.ketPpn == 'adaAllPpnKolektif') {
                ppn = pembelian.PPN / 100;
            } else {
                ppn = addedData.PPN / 100;
            }
            hargaPpn = hargaBeli * ppn;
            // if (kondisiAdaEditNominalPpn) {
            // 	totPpnQty = addedData.PPN;
            // } else {
            totPpnQty = hargaPpn * updatedQTY;
            // }
        } else if (ketAsal == 'editDiscFromTable') {
            // -------------------------------------> Disc di tabel - editDiscFromTable edit in cell disc
            updatedQTY = addedData.TERIMA;
            hargaBeli = addedData.HARGABELI;
            totDiscQty = editNominalDisc;
            hargaDisc = hargaBeli * disc;
            // ppn = addedData.PPN / 100;
            if (pembelian.ketPpn == 'adaAllPpnKolektif') {
                ppn = pembelian.PPN / 100;
            } else {
                ppn = addedData.PPN / 100;
            }
            hargaPpn = hargaBeli * ppn;
            if (kondisiAdaEditNominalPpn) {
                totPpnQty = addedData.PPN;
            } else {
                totPpnQty = hargaPpn * updatedQTY;
            }
        } else if (ketAsal == 'editPpnFromTable') {
            // -------------------------------------> Ppn di tabel - editPpnFromTable
            updatedQTY = addedData.TERIMA;
            hargaBeli = addedData.HARGABELI;
            // hargaDisc = addedData.DISCOUNT;
            totPpnQty = editNominalPpn;

            if (pembelian.ketDisc == 'adaAllDiscKolektif') {
                disc = pembelian.PERSDISC / 100;
            } else {
                disc = addedData.DISCOUNT / 100;
            }
            hargaDisc = hargaBeli * disc;
            if (kondisiAdaEditNominalDisc) {
                totDiscQty = addedData.DISCOUNT; // Gunakan editNominalDisc jika ada
            } else {
                totDiscQty = hargaDisc * updatedQTY; // Hitung nilai jika editNominalDisc tidak ada
            }
        } else if (ketAsal == 'dataEdit') {

            updatedQTY = addedData.TERIMA;
            hargaBeli = addedData.HARGABELI;
            // disc = addedData.DISCOUNT;
            // hargaDisc = hargaBeli * disc;
            // totDiscQty = hargaDisc * updatedQTY;
            totDiscQty = addedData.DISCOUNT;
            // ppn = addedData.PPN;
            // hargaPpn = hargaBeli * ppn;
            // totPpnQty = hargaPpn * updatedQTY;
            totPpnQty = addedData.PPN;
        } else {
            // -------------------------------------> edit in cell PPN
            ppn = 0;
            updatedQTY = addedData.TERIMA;
            hargaBeli = addedData.HARGABELI;
            if (pembelian.ketDisc == 'adaAllDiscKolektif') {
                disc = pembelian.PERSDISC / 100;
            } else {
                disc = addedData.DISCOUNT / 100;
            }
            hargaDisc = hargaBeli * disc;
            if (kondisiAdaEditNominalDisc) {
                totDiscQty = addedData.DISCOUNT; // Gunakan editNominalDisc jika ada
            } else {
                totDiscQty = hargaDisc * updatedQTY; // Hitung nilai jika editNominalDisc tidak ada
            }
            hargaPpn = hargaBeli * ppn;
            totPpnQty = editNominalPpn;
        }
        // return;

        const subTotal = updatedQTY * hargaBeli; // -------< Total SEBELUM Disc >
        // DISCOUNT - per barang
        // const hargaDisc = hargaBeli * disc;
        const hbAfterDisc = hargaBeli - hargaDisc; // -------< HARGABELI setelah Disc (dikurangi hargaDisc) per barang >
        // const hargaPpn = hargaBeli * ppn;

        const grandTotal = editedDisc === 0 ? hargaBeli : hbAfterDisc; // ---------------< GRAND TOTAL pake DISCOUNT>
        // const updatedGrandTotalDisc = updatedQTY * grandTotal;

        // const totPpnQty = hargaPpn * updatedQTY;
        const updatedGrandTotalDisc = subTotal - totDiscQty + totPpnQty;
        return { updatedGrandTotalDisc, hargaDisc, subTotal, disc, updatedQTY, hargaPpn, ppn, totDiscQty, totPpnQty, hargaBeli };
    };

    const onRowSelectBarcode = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        if (!selectedKode) {
            setBarcodeDialog(false);
            return;
        }
        try {
            const vaTable = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });
            const json = vaTable.data;

            if (json.status === '99') {
                // Menampilkan pesan error dengan Toast
                toast.current.show({
                    severity: 'error',
                    detail: json.message,
                    summary: 'Request Failed',
                    life: 3000,
                });
                return;
            }

            const valBarcode = json[0].BARCODE;
            const existingIndex = addPembelian.findIndex((item) => item.BARCODE === valBarcode);
            const qtyToAdd = event.data.TERIMA || 1;
            const addedData = { ...json[0], BONUS: true };

            const calculatePembelianData = (data) => {
                const terima = data ? data.TERIMA : 1;
                const harga = data ? parseFloat(data.HARGABELI || 0) : 0;
                const subtotal = terima * harga;
                console.log(subtotal);
                return {
                    ...data,
                    QTYPO: 0,
                    PO: 0,
                    HARGA: harga,
                    JUMLAH: 0,
                    TERIMA: terima,
                    GRANDTOTAL: 0,
                    SUBTOTAL: subtotal,
                };
            };

            if (existingIndex !== -1) {
                // Jika item sudah ada di tabel
                const updatedAddPembelian = [...addPembelian];
                const array = updatedAddPembelian.map((item, index) => (item.BARCODE === valBarcode ? index : null)).filter((index) => index !== null);

                if (updatedAddPembelian[array[array.length - 1]]?.BONUS) {
                    // Jika BONUS sudah ada di tabel (tambahkan QTY Bonus)
                    setAddPembelian((prevAddPembelian) => {
                        const updatedQty = updatedAddPembelian[array[array.length - 1]].TERIMA + qtyToAdd;
                        updatedAddPembelian[array[array.length - 1]].TERIMA = updatedQty;
                        updatedAddPembelian[array[array.length - 1]].SUBTOTAL = updatedQty * updatedAddPembelian[array[array.length - 1]].HARGA;
                        return [...updatedAddPembelian];
                    });
                    return;
                }

                setAddPembelian((prevAddPembelian) => [
                    ...prevAddPembelian,
                    calculatePembelianData({ ...addedData, TERIMA: qtyToAdd }),
                    ...json.slice(1).map((item) => calculatePembelianData({ ...item, TERIMA: qtyToAdd })),
                ]);
            } else {
                // Jika item belum ada di tabel
                setAddPembelian((prevAddPembelian) => [
                    ...prevAddPembelian,
                    calculatePembelianData({ ...addedData, TERIMA: qtyToAdd }),
                    ...json.slice(1).map((item) => calculatePembelianData({ ...item, TERIMA: qtyToAdd })),
                ]);
            }

            setBarcodeDialog(false);
        } catch (error) {
            console.error('Error fetching barcode data:', error);
            setBarcodeDialog(false);
        }
    };


    const onRowSelectBarcode1 = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        if (!selectedKode) {
            setBarcodeDialog(false);
            return;
        }
        try {
            const vaTable = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });
            const json = vaTable.data;
            if (json.status === '99') {
                // Menampilkan pesan error dengan menggunakan Toast
                toast.current.show({
                    severity: 'error',
                    detail: json.message,  // Menampilkan pesan yang diterima
                    summary: 'Request Failed',  // Menambahkan detail kesalahan secara umum
                    life: 3000  // Durasi tampilan pesan toast (dalam milidetik)
                });
            }

            const valBarcode = json[0].BARCODE;
            const existingIndex = addPembelian.findIndex((item) => item.BARCODE === valBarcode);
            const qtyToAdd = event.data.TERIMA || 1;
            const addedData = { ...json[0], BONUS: true };

            const calculatePembelianData = (data) => {
                const terima = data ? data.TERIMA : 1;
                return {
                    ...data,
                    QTYPO: 0,
                    PO: 0,
                    HARGA: 0,
                    JUMLAH: 0,
                    TERIMA: terima,
                    GRANDTOTAL: 0,
                    SUBTOTAL: 0
                };
            };
            if (existingIndex !== -1) {
                // -------------------------------------------------------------------------------------< Kalo sudah ada di tabel >
                const updatedAddPembelian = [...addPembelian];
                const array = updatedAddPembelian.map((item, index) => (item.BARCODE === valBarcode ? index : null)).filter((index) => index !== null);
                // return;

                if (updatedAddPembelian[array[array.length - 1]]?.BONUS) {
                    // ----------------------------------------------------------------------------------< Kalo BONUS sudah ada di tabel (nambah QTY Bonus) >
                    setAddPembelian((prevAddPembelian) => {
                        const updatedQty = updatedAddPembelian[array[array.length - 1]].TERIMA + qtyToAdd;
                        updatedAddPembelian[array[array.length - 1]].TERIMA = updatedQty;
                        return [...updatedAddPembelian];
                    });
                    return;
                }
                setAddPembelian((prevAddPembelian) => [...prevAddPembelian, calculatePembelianData({ ...addedData, TERIMA: qtyToAdd }), ...json.slice(1).map((item) => ({ ...item, TERIMA: qtyToAdd }))]);
            } else {
                // -------------------------------------------------------------------------------------< Kalo Belum ada di tabel >
                setAddPembelian((prevAddPembelian) => [...prevAddPembelian, calculatePembelianData({ ...addedData, TERIMA: qtyToAdd }), ...json.slice(1).map((item) => ({ ...item, TERIMA: qtyToAdd }))]);
            }
            setBarcodeDialog(false);
        } catch (error) {
            console.log('Error fetching barcode data:', error);
            // Handle the error accordingly, e.g., show an error message
            setBarcodeDialog(false);
        }
    };

    const onQtyUpdate = (updatedAddPembelian) => {
        setAddPembelian(updatedAddPembelian);
    };
    // ---------------------------------------------------------------------------------------------< Search Barcode by inputan (enter) >
    const [timer, setTimer] = useState(null);
    const handleBarcodeKeyDown = async (event) => {
        clearTimeout(timer);
        const newTimer = setTimeout(async () => {
            if (event.key === 'Enter') {
                const barcodeInput = document.getElementById('barcode');
                const enteredBarcode = barcodeInput.value;

                if (enteredBarcode.trim() === '') {
                    return;
                }
                // Periksa apakah barcode yang dimasukkan mencakup kuantitas
                const barcodeDanQty = enteredBarcode.split('*');
                let enteredQty = 1;
                let enteredBarcodeValue = enteredBarcode;

                if (barcodeDanQty.length === 2) {
                    enteredQty = parseFloat(barcodeDanQty[0]);
                    enteredBarcodeValue = barcodeDanQty[1];
                }

                const params = { data: { KODE_TOKO: enteredBarcodeValue }, skipSelectBarcode: true, qty: enteredQty };
                await onRowSelectBarcode(params);

                barcodeInput.value = '';
            }
        }, 100);
        setTimer(newTimer);
    };

    // ----------------------------------------------------------------------------------------< edit in cell >
    const [varEditNominalDisc, setVarEditNominalDisc] = useState(null);
    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;

        switch (field) {
            case 'TERIMA':
                if (!isNaN(newValue)) {
                    // Check if newValue is a valid number
                    const editedQty = parseFloat(newValue);

                    if (!isNaN(editedQty)) {
                        // Check if editedQty is a valid number
                        if (editedQty === 0 || editedQty === '') {
                            deleteSelectedRow(rowData);
                        } else {
                            const updatedAddPembelian = addPembelian.map((item) => {
                                if (item.BARCODE === rowData.BARCODE) {
                                    const addedData = rowData;
                                    const initialQty = addedData.TERIMA;
                                    const qtyToAdd = editedQty - initialQty;
                                    const ketAsal = 'editQTYFromTable';

                                    const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, null, editedQty, undefined, ketAsal, null, null, null);
                                    const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                                    const hargaDisc = funcCalculate.hargaDisc;
                                    const subTotal = funcCalculate.subTotal;
                                    const totDiscQty = funcCalculate.totDiscQty;
                                    const totPpnQty = funcCalculate.totPpnQty;

                                    return { ...item, TERIMA: editedQty, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, DISCOUNT: totDiscQty, PPN: totPpnQty };
                                } else {
                                    return item;
                                }
                            });

                            setAddPembelian(updatedAddPembelian);

                            // Call a function in index.js to handle the updated addPembelian
                            if (onQtyUpdate) {
                                onQtyUpdate(updatedAddPembelian);
                            }
                        }
                    } else {
                        // Handle the case when newValue is not a valid number
                        console.log('Invalid input. Please enter a valid number for QTY.');
                    }
                } else {
                    // Handle the case when newValue is not a valid number
                    console.log('Invalid input. Please enter a valid number for QTY.');
                }
                break;
            case 'HARGABELI':
                if (!isNaN(newValue)) {
                    let editHargaBeli = parseInt(newValue);
                    if (editHargaBeli < 0) {
                        toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Harga Beli Tidak Boleh Lebih dari 100%', life: 3000 });
                        return;
                    }
                    const updatedAddPembelian = addPembelian.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.TERIMA;
                            const ketAsal = 'editHargaBeliFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, editHargaBeli, null, null);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subTotal = funcCalculate.subTotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, SUBTOTAL: subTotal, HARGABELI: editHargaBeli, GRANDTOTAL: updatedGrandTotalDisc, DISCOUNT: totDiscQty, PPN: totPpnQty };
                        } else {
                            return item;
                        }
                    });

                    setAddPembelian(updatedAddPembelian);

                    // Call a function in index.js to handle the updated addPembelian
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddPembelian);
                    }
                } else {
                    // Handle the case when newValue is not a valid integer
                    console.log('Invalid input. Please enter a valid integer for DISCOUNT.');
                }
                break;
            case 'DISCOUNT':
                if (!isNaN(newValue)) {
                    let editNominalDisc = parseInt(newValue);
                    if (editNominalDisc < 0) {
                        toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Disc Tidak Boleh Lebih dari 100%', life: 3000 });
                        return;
                    }
                    if (newValue === '') {
                        editNominalDisc = 0;
                    }
                    const updatedAddPembelian = addPembelian.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.TERIMA;
                            const ketAsal = 'editDiscFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, editNominalDisc, null);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            console.log(funcCalculate);
                            const subTotal = funcCalculate.subTotal;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, DISCOUNT: editNominalDisc, PPN: totPpnQty };
                        } else {
                            return item;
                        }
                    });

                    setAddPembelian(updatedAddPembelian);

                    // Call a function in index.js to handle the updated addPembelian
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddPembelian);
                    }
                } else {
                    // Handle the case when newValue is not a valid integer
                    console.log('Invalid input. Please enter a valid integer for DISCOUNT.');
                }
                break;
            case 'PPN':
                if (!isNaN(newValue)) {
                    let editNominalPpn = parseInt(newValue);
                    if (editNominalPpn < 0) {
                        toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Disc Tidak Boleh Lebih dari 100%', life: 3000 });
                        return;
                    }
                    if (newValue === '') {
                        editNominalPpn = 0;
                    }
                    const updatedAddPembelian = addPembelian.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.TERIMA;
                            const ketAsal = 'editPpnFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, null, editNominalPpn);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const subTotal = funcCalculate.subTotal;
                            const totDiscQty = funcCalculate.totDiscQty;

                            return { ...item, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, DISCOUNT: totDiscQty, PPN: editNominalPpn };
                        } else {
                            return item;
                        }
                    });

                    setAddPembelian(updatedAddPembelian);

                    // Call a function in index.js to handle the updated addPembelian
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddPembelian);
                    }
                } else {
                    // Handle the case when newValue is not a valid integer
                    console.log('Invalid input. Please enter a valid integer for DISCOUNT.');
                }
                break;
            default:
                break;
        }
    };
    const cellEditor = (options) => {
        return textEditor(options);
    };
    const textEditor = (options) => {
        return <InputText type="number" step="any" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const deleteSelectedRow = (rowData) => {
        const updatedAddPembelian = addPembelian.filter((row) => row !== rowData);
        setAddPembelian(updatedAddPembelian);
    };

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };
    // ----------------------------------------------------------------------------------------------------------------------
    const [inputValue, setInputValue] = useState('');
    const [defaultOption, setDropdownValue] = useState(null);

    const dropdownValues = [
        { name: 'KODE_TOKO', label: 'BARCODE' },
        { name: 'NAMA', label: 'NAMA' }
    ];
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    // ----------------------------------------------------------------------------------------------------------------< Save PO >
    const createDataObject = (_pembelian, _addPembelian) => {
        // return;
        const data = {
            FAKTUR: faktur,
            FAKTURPO: '',
            FAKTURASLI: _pembelian.FAKTURASLI || '',
            TGLFAKTUR: formatDateSave(_pembelian.TGLFAKTUR) || new Date(),
            // TGL: formatDateSave(_pembelian.TGL) || new Date(),
            // TGLDELIVERY: formatDateSave(_pembelian.TGLDELIVERY) || new Date(),
            // JTHTMP: formatDateSave(_pembelian.JTHTMP) || new Date(),
            TGL: readOnlyEdit ? _pembelian.TGL : formatDateSave(_pembelian.TGL),
            TGLDELIVERY: readOnlyEdit ? _pembelian.TGLDELIVERY : formatDateSave(_pembelian.TGLDELIVERY) || new Date(),
            JTHTMP: readOnlyEdit ? _pembelian.JTHTMP : formatDateSave(_pembelian.JTHTMP),
            PEMBAYARAN: 'T',
            GUDANG: gudangKode || _pembelian.GUDANG,
            SUPPLIER: supplierKode || _pembelian.SUPPLIER,
            PERSDISC: _pembelian.PERSDISC,
            DISCOUNT: totDisc,
            DISCOUNT2: _pembelian.PEMBULATAN,
            PPN: _pembelian.PPN,
            PPN: totPpn,
            SUBTOTAL: totSubTotal,
            TOTAL: totGrandTotal,
            KETERANGAN: _pembelian.KETERANGAN,
            tabelTransaksiPembelian: _addPembelian
                .map((item) => {
                    const TERIMA = item.TERIMA !== null ? item.TERIMA : 0;
                    const defaultExpired = item.TGLEXP ? `${item.TGLEXP.split('-')[1]}-${item.TGLEXP.split('-')[0]}-01` : getExpired();
                    if (TERIMA > 0) {
                        const valTerimaBarang = item.TERIMABARANG + item.TERIMA;
                        return {
                            BARCODE: item.BARCODE,
                            KODE: item.KODE,
                            QTY: item.QTYPO,
                            TERIMABARANG: valTerimaBarang || 0,
                            TERIMA: item.TERIMA || 0,
                            HARGA: item.HARGABELI,
                            HJ: item.HJ,
                            SATUAN: item.SATUAN,
                            DISCOUNT: item.DISCOUNT || 0,
                            PPN: item.PPN || 0,
                            JUMLAH: item.GRANDTOTAL,
                            TGLEXP: item.TGLEXP
                            // TGLEXP: "2024-05-01",
                        };
                    } else {
                        // toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'QTY Terima Masih 0', life: 3000 });
                        return null; // Jika retur <= 0, maka null digunakan sebagai placeholder
                    }
                })
                .filter((item) => item !== null) // Menghapus objek yang bernilai null
        };
        return data;
    };

    const savePo = async (e) => {
        e.preventDefault();
        let _pembelian = { ...pembelian };
        let _addPembelian = [...addPembelian];
        let _data = createDataObject(_pembelian, _addPembelian);
        // return;
        if (_data.GUDANG == null || _data.GUDANG == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
            return;
        }
        if (_data.SUPPLIER == null || _data.SUPPLIER == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Supplier Masih Kosong!', life: 3000 });
            return;
        }
        if (addPembelian.length == 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Daftar Barang Masih Kosong!', life: 3000 });
            return;
        }
        // return;
        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            // return;
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': endPoint
            };
            // const vaTable = await axios.post(apiDirPath, _data, { headers: header });
            const vaTable = await postData(endPoint, _data);
            const json = vaTable.data;
            if (json.code === '200') {
                toast.current.show({ severity: 'success', summary: json.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
                router.push('/pembelian/penerimaan-barang');
            } else {
                toast.current.show({ severity: 'error', summary: json.message, detail: json.messageValidator, life: 3000 });
            }
            // if (json.status === "success") {
            // 	router.push("/pembelian/penerimaan-barang");
            // 	toast.current.show({ severity: "success", summary: "Successful", detail: "Berhasil Menyimpan Data", life: 3000 });
            // } else {
            // 	toast.current.show({ severity: "error", summary: "Error Message", detail: "Kesalahan proses", life: 3000 });
            // }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
        }
    };
    // ---------------------------------------------------------------------------------------------------------------- Button
    const rightFooterTemplate = (rowData) => {
        return (
            <React.Fragment>
                <div className="my-2">
                    {/* <Button label="Delete" className="p-button-danger p-button mr-2" onClick={deleteSelectedRow}/> */}
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={savePo} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/pembelian/penerimaan-barang');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    const totQty = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.QTYPO), 0);
    const totDiterima = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.TERIMABARANG);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totTerima = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.TERIMA);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totHarga = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.HARGA), 0);
    const totSubTotal = addPembelian.reduce((accumulator, item) => accumulator + parseInt(item.SUBTOTAL), 0);
    const totDisc = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.DISCOUNT), 0);
    const totPpn = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.PPN), 0) || 0;
    const totGrandTotal = addPembelian.reduce((accumulator, item) => accumulator + parseInt(item.GRANDTOTAL), 0 || 0);

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={2} footerStyle={{ textAlign: 'right' }} />
                {/* <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totQty.toString()} footerStyle={{ textAlign: 'center' }} /> */}
                {/* <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totDiterima.toString()} footerStyle={{ textAlign: 'center' }} /> */}
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totTerima.toString()} footerStyle={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={2} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totSubTotal.toLocaleString()}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totDisc.toLocaleString()}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totPpn.toLocaleString()}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totGrandTotal.toLocaleString()}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={3} />
            </Row>
        </ColumnGroup>
    );

    // ----------------------------------------------------------------------------------------------------------------------------< EDIT AREA >
    const fetchDataForEdit = async () => {
        // const { FAKTUR } = router.query;
        const FAKTUR = localStorage.getItem('FAKTUR');
        try {
            setLoading(true);
            let requestBody = {
                FAKTUR: FAKTUR
            };
            const header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPOINT': apiEndPointGetDataEdit };
            // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;
            // setPageTitle("Edit Purchase Order");
            setPembelian(json);

            const addPembelian = json.tabelTransaksiPembelian;
            let _data = [...addPembelian];
            if (_data && Array.isArray(_data)) {
                const funcCalculateArray = [];
                // Iterasi melalui array dan panggil calculateUpdatedGrandTotalDisc untuk setiap elemen
                for (let i = 0; i < _data.length; i++) {
                    const data = _data[i];
                    const ketAsal = 'dataEdit';
                    const funcCalculate = await calculateUpdatedGrandTotalDisc(data, null, null, null, ketAsal);
                    funcCalculateArray.push(funcCalculate);
                }

                // Set addItem setelah semua perhitungan selesai
                setAddPembelian(() => {
                    const updatedAddItem = _data.map((data, index) => {
                        const funcCalc = funcCalculateArray[index];
                        return {
                            KODE: data.KODE,
                            BARCODE: data.BARCODE,
                            NAMA: data.NAMA,
                            QTYPO: data.QTYPO,
                            TERIMABARANG: data.TERIMABARANG,
                            TERIMA: data.TERIMA,
                            DISCOUNT: data.DISCOUNT,
                            TGLEXP: data.TGLEXP,
                            SATUAN: data.SATUAN,
                            HARGABELI: data.HARGABELI,
                            HJ: data.HJ,
                            SUBTOTAL: funcCalc.subTotal,
                            DISCOUNT: funcCalc.totDiscQty,
                            PPN: funcCalc.totPpnQty,
                            GRANDTOTAL: funcCalc.updatedGrandTotalDisc
                        };
                    });
                    return updatedAddItem;
                });
            } else {
                // If detail is not an array or does not exist, set addPo to an empty array
                setAddPembelian([]);
            }
        } catch (error) {
            console.log('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };
    const dataFuncCalculate = async (data) => {
        if (data && Array.isArray(data)) {
            let _data = [...data];
            const funcCalculateArray = [];
            // Iterasi melalui array dan panggil calculateUpdatedGrandTotalDisc untuk setiap elemen
            for (let i = 0; i < _data.length; i++) {
                const data = _data[i];
                const ketAsal = 'dataEdit';
                const funcCalculate = await calculateUpdatedGrandTotalDisc(data, null, null, null, ketAsal);
                funcCalculateArray.push(funcCalculate);
            }

            // Set addItem setelah semua perhitungan selesai
            setAddPembelian(() => {
                const updatedAddItem = _data.map((data, index) => {
                    const funcCalc = funcCalculateArray[index];
                    return {
                        KODE: data.KODE,
                        BARCODE: data.BARCODE,
                        NAMA: data.NAMA,
                        TERIMA: funcCalc.updatedQTY,
                        SATUAN: data.SATUAN,
                        HARGABELI: data.HARGABELI,
                        SUBTOTAL: funcCalc.subTotal,
                        DISCOUNT: funcCalc.totDiscQty,
                        PPN: funcCalc.totPpnQty,
                        GRANDTOTAL: funcCalc.updatedGrandTotalDisc
                    };
                });
                return updatedAddItem;
            });
        } else {
            // If detail is not an array or does not exist, set addPembelian to an empty array
            setAddPembelian([]);
        }
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>{isUpdateMode ? 'Edit' : 'Add'} Pembelian / Penerimaan Barang Tanpa Faktur PO</h4>
                <hr />
                <Toast ref={toast} />
                <div>
                    <div className="formgrid grid">
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="faktur">Faktur</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={faktur} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="">Gudang</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={gudangKode || pembelian.GUDANG} />
                                <Button icon="pi pi-search" className="p-button" onClick={btnGudang} disabled={readOnlyEdit} />
                                <InputText readOnly value={gudangKet || pembelian.KETGUDANG} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-4">
                            <label htmlFor="tgl">Tanggal</label>
                            <div className="p-inputgroup">
                                <Calendar disabled={readOnlyEdit} value={pembelian.TGL && pembelian.TGL ? new Date(pembelian.TGL) : new Date()} onChange={(e) => onInputChange(e, 'TGL')} id="tgl" showIcon dateFormat="dd-mm-yy" />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-4">
                            <label htmlFor="tgl">Tanggal DO</label>
                            <div className="p-inputgroup">
                                <Calendar disabled={readOnlyEdit} value={pembelian.TGLDO && pembelian.TGLDO ? new Date(pembelian.TGLDO) : new Date()} onChange={(e) => onInputChange(e, 'TGLDO')} id="tglDo" showIcon dateFormat="dd-mm-yy" />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-4">
                            <label htmlFor="tgl">Jatuh Tempo</label>
                            <div className="p-inputgroup">
                                <Calendar disabled={readOnlyEdit} value={pembelian.JTHTMP && pembelian.JTHTMP ? new Date(pembelian.JTHTMP) : new Date()} onChange={(e) => onInputChange(e, 'JTHTMP')} id="jthtmp" showIcon dateFormat="dd-mm-yy" />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="discount">Discount</label>
                            <div className="p-inputgroup">
                                <Checkbox readOnly={readOnlyEdit} style={{ marginRight: '10px' }} checked={checked} onChange={onCheckboxChange} />
                                <InputNumber inputStyle={{ textAlign: 'right' }} readOnly={readOnlyEdit} value={pembelian.PERSDISC} onChange={(e) => onInputNumberChange(e, 'PERSDISC')} required={checked} disabled={!checked} placeholder={checked ? 'Discount' : ''} />
                                <Button icon="pi pi-percentage" className="p-button" readOnly />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-2">
                            <label htmlFor="ppn">Ppn</label>
                            <div className="p-inputgroup">
                                <Checkbox readOnly={readOnlyEdit} checked={checkedPpn} onChange={onCheckboxPpnChange} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-4">
                            <label htmlFor="Pembayaran">Pembayaran</label>
                            <div className="p-inputgroup">
                                <RadioButton inputId="tunai" name="pembayaran" value="T" style={{ marginRight: '5px' }} checked readOnly />
                                <label htmlFor="tunai">Tunai</label>
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-4">
                            <label htmlFor="discount">Discount</label>
                            <div className="p-inputgroup">
                                <Button className="p-button" readOnly>
                                    <span>Rp</span>
                                </Button>
                                <InputNumber value={pembelian.PEMBULATAN} placeholder="Disc Pembulatan" onChange={(e) => onInputNumberChange(e, 'PEMBULATAN')} required />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-8">
                            <label htmlFor="fakturasli">Keterangan</label>
                            <div className="p-inputgroup">
                                <InputText value={pembelian.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} />
                                {/* readOnly={readOnlyEdit} */}
                            </div>
                        </div>
                        {/* </div>
						</div> */}
                        {/* <div className="field col-6 mb-2 lg:col-6">
							<div className="formgrid grid"> */}
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="supplier">Supplier</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={supplierKode || pembelian.SUPPLIER} />
                                <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} disabled={readOnlyEdit} />
                                <InputText readOnly value={supplierNama || pembelian.NAMA} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="kota">Alamat</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={supplierAlamat || pembelian.ALAMAT} />
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-12">
                            <label htmlFor="supplier">Barcode</label>
                            <div className="p-inputgroup">
                                <InputText id="barcode" onKeyDown={handleBarcodeKeyDown} />
                                <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                            </div>
                        </div>
                    </div>
                </div>
                <hr></hr>
                <DataTable
                    value={addPembelian}
                    size="small"
                    lazy
                    dataKey="KODE"
                    // paginator
                    rows={10}
                    editMode="cell"
                    className="datatable-responsive editable-cells-table"
                    first={lazyState.first}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    loading={loading}
                    footerColumnGroup={footerGroup}
                    scrollable
                    scrollHeight="200px"
                    frozenFooter
                >
                    <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="KODE"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="TERIMA"
                        header="TERIMA"
                        editor={(options) => cellEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => {
                            const value = rowData.TERIMA ? parseInt(rowData.TERIMA).toLocaleString() : '0';
                            return value;
                        }}
                        bodyStyle={{ textAlign: 'center' }}
                    ></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="SATUAN" header="SATUAN"></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="HARGABELI"
                        header="HARGA BELI"
                        body={(rowData) => {
                            const value = rowData.HARGABELI ? parseInt(rowData.HARGABELI).toLocaleString() : 0;
                            return value;
                        }}
                        bodyStyle={{ textAlign: 'center' }}
                        editor={(options) => textEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                    ></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="SUBTOTAL"
                        header="SUBTOTAL"
                        body={(rowData) => {
                            const value = rowData.SUBTOTAL ? parseInt(rowData.SUBTOTAL).toLocaleString() : 0;
                            return value;
                        }}
                        bodyStyle={{ textAlign: 'right' }}
                    ></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="DISCOUNT"
                        header="DISCOUNT"
                        editor={(options) => textEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => formatRibuan(rowData.DISCOUNT)}
                        bodyStyle={{ textAlign: 'right' }}
                    ></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="PPN"
                        header="PPN"
                        editor={(options) => textEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => {
                            const value = rowData.PPN ? parseInt(rowData.PPN).toLocaleString() : 0;
                            return value;
                        }}
                        bodyStyle={{ textAlign: 'right' }}
                    ></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="GRANDTOTAL"
                        header="GRAND TOTAL"
                        body={(rowData) => {
                            const value = rowData.GRANDTOTAL ? parseInt(rowData.GRANDTOTAL).toLocaleString() : 0;
                            return value;
                        }}
                        bodyStyle={{ textAlign: 'right' }}
                    ></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="HJ"
                        header="HARGA JUAL"
                        body={(rowData) => {
                            const value = rowData.HJ ? parseInt(rowData.HJ).toLocaleString() : 0;
                            return value;
                        }}
                        editor={(options) => textEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        bodyStyle={{ textAlign: 'right' }}
                    ></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="TGLEXP"
                        header="TGLEXP"
                        body={(rowData) => formatTglExpired(rowData.TGLEXP)}
                        editor={(props) => <ExpiredEditor {...props} />}
                        onCellEditComplete={(e) => {
                            const newValue = e.newValue instanceof Date ? formatTglExpired(e.newValue) : formatTglExpired(rowData.TGLEXP);
                            onCellEditComplete({ ...e, newValue });
                        }}
                    ></Column>
                    <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>
                <br></br>
                <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>

                <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
            </div>

            <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
            <Produk produkDialog={barcodeDialog} setProdukDialog={setBarcodeDialog} btnProduk={btnProduk} handleProdukData={handleProdukData} />
        </div>
    );
}

export default MasterAddPembelian;
