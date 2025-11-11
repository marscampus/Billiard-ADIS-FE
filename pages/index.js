import { useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../utilities/servertool';
import { TabView, TabPanel } from 'primereact/tabview';
import { Sidebar } from 'primereact/sidebar';
import { DataView } from 'primereact/dataview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Chip } from 'primereact/chip';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import postData from '../lib/Axios';
import { convertToISODate, rupiahConverter } from '../component/GeneralFunction/GeneralFunction';
import { useFormik } from 'formik';
import { InputNumber } from 'primereact/inputnumber';
import { Tooltip } from 'primereact/tooltip';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RadioButton } from 'primereact/radiobutton';
import { Menu } from 'primereact/menu';
import { FilterMatchMode } from 'primereact/api';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function DashboardDua(props) {
    // state
    const toast = useRef(null);
    const [dataDash, setDataDash] = useState({
        //kamar list
        data: [],
        load: false,
        filterValue: '',
        filteredData: [],
        kamarTersedia: 0,
        totKamar: 0,
        kamarTerpakai: 0,

        //data kamar
        // dataKamar: [],
        filterKamar: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
        searchDataKamar: ''
    });
    //

    //function
    const filterSearch = (searchVal) => {
        const regex = searchVal ? new RegExp(searchVal, 'i') : null;

        // Jika tidak ada teks pencarian, kembalikan data asli
        const filtered = !searchVal
            ? dataDash.data
            : dataDash.data.map((item) => ({
                ...item,
                kamar: regex ? item.kamar.filter((k) => regex.test(k.no_kamar)) : item.kamar
            }));

        setDataDash((prev) => ({
            ...prev,
            filteredData: filtered,
            filterValue: searchVal
        }));
    };

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const getDataDash = async () => {
        setDataDash((prev) => ({ ...prev, load: true }));
        try {
            const res = await postData('/api/dashboard/get-kamar', {});
            console.log(res.data);
            setDataDash((prev) => ({ ...prev, data: res.data.data, load: false, totKamar: res.data.tot_kamar, kamarTerpakai: res.data.kamar_terpakai, kamarTersedia: res.data.kamar_tersedia }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataDash((prev) => ({ ...prev, data: [], load: false }));
        }
    };

    useEffect(() => {
        getDataDash();
    }, []);
    //

    // template
    const itemKamarTemplate = (data) => {
        return (
            <div className="col-3 md:col-2 gap-2 p-1 p-relative">
                <div
                    className={data.status_kamar == 0 ? 'bg-green-800' : 'bg-red-600'}
                    style={{
                        display: 'flex',
                        padding: '10px',
                        color: 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                    }}
                >
                    <b>{data.no_kamar}</b>
                </div>
            </div>
        );
    };

    const headerDataKamarTemplate = () => {
        return (
            <div className="flex">
                <InputText
                    value={dataDash.searchDataKamar}
                    placeholder="Cari No Meja"
                    className="w-full"
                    onChange={(e) => {
                        const value = e.target.value;
                        let _filters = { ...dataDash.filterKamar };

                        _filters['global'].value = value;

                        setDataDash((prev) => ({ ...prev, filterKamar: _filters, searchDataKamar: value }));
                    }}
                />
            </div>
        );
    };
    //

    return (
        <>
            <Toast ref={toast} />

            <div className="grid">
                <div className="col-12 lg:col-4 my-2">
                    <div className="card">
                        <div className="flex justify-content-between">
                            <div>
                                <span className="block text-700 font-medium text-xl">Total Meja Billiard</span>
                                <div className="text-900 font-medium text-5xl text-center">{dataDash.totKamar}</div>
                            </div>
                            <div className="flex align-items-center">
                                <i className="pi pi-calendar-plus text-7xl"></i>
                            </div>
                        </div>
                        <div className="text-700 font-medium text-sm">Jumlah Meja yang dimiliki</div>
                    </div>
                </div>
                <div className="col-12 lg:col-4 my-2">
                    <div className="card">
                        <div className="flex justify-content-between">
                            <div>
                                <span className="block text-700 font-medium text-xl">Meja Tersedia</span>
                                <div className="text-900 font-medium text-5xl text-center">{dataDash.kamarTersedia}</div>
                            </div>
                            <div className="flex align-items-center">
                                <i className="pi pi-calendar-plus text-7xl"></i>
                            </div>
                        </div>
                        <div className="text-700 font-medium text-sm">Jumlah Meja yang tidak sedang digunakan</div>
                    </div>
                </div>
                <div className="col-12 lg:col-4 my-2">
                    <div className="card">
                        <div className="flex justify-content-between">
                            <div>
                                <span className="block text-700 font-medium text-xl">Meja Terpakai</span>
                                <div className="text-900 font-medium text-5xl text-center">{dataDash.kamarTerpakai}</div>
                            </div>
                            <div className="flex align-items-center">
                                <i className="pi pi-calendar-plus text-7xl"></i>
                            </div>
                        </div>
                        <div className="text-700 font-medium text-sm">Jumlah Meja yang sedang digunakan</div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ height: '100%' }}>
                <div className="">
                    {dataDash.load ? (
                        <div className="flex flex-column gap-2 col-12">
                            <Skeleton className="w-full" height="40px" />
                            <div className="flex gap-2">
                                <Skeleton height="150px" />
                                <Skeleton height="150px" />
                                <Skeleton height="150px" />
                                <Skeleton height="150px" />
                            </div>
                        </div>
                    ) : (
                        <TabView>
                            {(dataDash.filterValue ? dataDash.filteredData : dataDash.data).map((item, index) => {
                                return (
                                    <TabPanel key={index} header={item.tipe_kamar} className="">
                                        <div className="grid">
                                            <div className="col-8 " style={{ height: '480px' }}>
                                                <div className="flex h-full flex-column justify-content-between">
                                                    <DataView value={item.kamar} className="w-full" dataKey="no_kamar" style={{ overflowY: 'auto' }} itemTemplate={itemKamarTemplate} layout={'grid'} />
                                                    <div
                                                        style={{
                                                            backgroundColor: '#F8F9FA',
                                                            padding: '10px 20px',
                                                            borderTop: 'solid 1px #aaaaaa',
                                                            borderBottom: 'solid 1px #aaaaaa',
                                                            marginTop: '10px'
                                                        }}
                                                    >
                                                        <div className="flex flex-column font-bold">
                                                            <b>Keterangan :</b>
                                                            <div className="flex gap-2 mt-2">
                                                                <div>
                                                                    <div
                                                                        className={'bg-green-800'}
                                                                        style={{
                                                                            display: 'flex',
                                                                            padding: '10px',
                                                                            color: 'white',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            borderRadius: '4px',
                                                                            width: '80px'
                                                                        }}
                                                                    >
                                                                        <b>-</b>
                                                                    </div>
                                                                    <b>Tersedia</b>
                                                                </div>
                                                                <div>
                                                                    <div
                                                                        className={'bg-red-600'}
                                                                        style={{
                                                                            display: 'flex',
                                                                            padding: '10px',
                                                                            color: 'white',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            borderRadius: '4px'
                                                                        }}
                                                                    >
                                                                        <b>-</b>
                                                                    </div>
                                                                    <b>Tidak Tersedia</b>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card col-4">
                                                <DataTable value={item.kamar_used} scrollable scrollHeight="370px" header={headerDataKamarTemplate} filters={dataDash.filterKamar} globalFilterFields={['no_kamar']}>
                                                    <Column field="no_kamar" header="Meja"></Column>
                                                    <Column field="tgl_checkout" header="Checkout"></Column>
                                                </DataTable>
                                            </div>
                                        </div>
                                    </TabPanel>
                                );
                            })}
                        </TabView>
                    )}
                </div>
            </div>
        </>
    );
}
