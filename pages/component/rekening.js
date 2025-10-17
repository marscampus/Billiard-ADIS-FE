import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabPanel, TabView } from 'primereact/tabview';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';

const KATEGORI_REKENING = [
    { id: 1, label: 'ASET' },
    { id: 2, label: 'KEWAJIBAN' },
    { id: 3, label: 'MODAL' },
    { id: 4, label: 'PENDAPATAN' },
    { id: 5, label: 'BIAYA' },
    { id: 6, label: 'ADMINISTRATIF' }
];

export default function Rekening({ rekeningDialog, setRekeningDialog, handleRekeningData }) {
    const apiEndPointGetRekening = '/api/rekening/get_rekening';
    const [originalData, setOriginalData] = useState({});
    const [filteredData, setFilteredData] = useState({});
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const searchTimeout = useRef(null);

    useEffect(() => {
        if (rekeningDialog) {
            fetchData();
        }
    }, [rekeningDialog]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await postData(apiEndPointGetRekening);
            const data = response.data.data;

            const categorizedData = KATEGORI_REKENING.reduce((acc, curr) => {
                acc[curr.id] = data.filter((item) => item.KODE.charAt(0) === curr.id.toString());
                return acc;
            }, {});

            setOriginalData(categorizedData);
            setFilteredData(categorizedData); // Inisialisasi filteredData dengan data original
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (searchValue) => {
        clearTimeout(searchTimeout.current);
        setSearch(searchValue);

        searchTimeout.current = setTimeout(() => {
            if (!searchValue) {
                // Jika search kosong, reset ke data original
                setFilteredData(originalData);
                return;
            }

            // Filter dari data original setiap kali pencarian
            const newFilteredData = Object.keys(originalData).reduce((acc, key) => {
                acc[key] = originalData[key].filter((item) => item.KODE.toLowerCase().includes(searchValue.toLowerCase()) || item.KETERANGAN.toLowerCase().includes(searchValue.toLowerCase()));
                return acc;
            }, {});

            setFilteredData(newFilteredData);
        }, 300);
    };

    const renderJenisRekening = (rowData) => <span>{rowData.JENISREKENING === 'I' ? 'INDUK' : 'DETAIL'}</span>;

    const renderTabPanels = () =>
        KATEGORI_REKENING.map((kategori) => (
            <TabPanel key={kategori.id} header={kategori.label}>
                {loading ? (
                    <div className="flex justify-content-center align-items-center min-h-200">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                ) : (
                    <DataTable value={filteredData[kategori.id] || []} onRowSelect={handleRowSelect} selectionMode="single" className="datatable-responsive" size="small">
                        <Column field="KODE" header="KODE" />
                        <Column field="KETERANGAN" header="KETERANGAN" />
                        <Column field="JENISREKENING" header="JENIS REKENING" body={renderJenisRekening} />
                    </DataTable>
                )}
            </TabPanel>
        ));

    const handleRowSelect = (event) => {
        handleRekeningData(event.data.KODE, event.data.KETERANGAN, event.data.JENISREKENING);
        setRekeningDialog(false);
    };

    return (
        <Dialog visible={rekeningDialog} header="Rekening" modal className="p-fluid" onHide={() => setRekeningDialog(false)} style={{ width: '80vw' }}>
            <div className="mb-3">
                <span className="p-input-icon-left w-full">
                    <i className="pi pi-search" />
                    <InputText value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Cari berdasarkan KODE atau KETERANGAN..." className="w-full" />
                </span>
            </div>

            <TabView>{renderTabPanels()}</TabView>
        </Dialog>
    );
}
