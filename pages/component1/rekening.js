import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabPanel, TabView } from 'primereact/tabview';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';

export default function Rekening({ rekeningDialog, setRekeningDialog, btnRekening, handleRekeningData }) {
    const apiEndPointGetRekening = '/api/rekening/get_rekening';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingRekening, setLoadingRekening] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rekeningTable, setRekeningTable] = useState([]);
    const [defaultOption, setDropdownValue] = useState(null);
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
        if (rekeningDialog && btnRekening) {
            toggleRekening();
        }
    }, [rekeningDialog, btnRekening, lazyState]);

    const toggleDataTable = async (event) => {
        setActiveIndex(event.index);
        let _lazyState = { ...lazyState };
        _lazyState['filters']['KODE'] = event.index + 1;
        setlazyState(_lazyState);
    };

    const [activeIndex, setActiveIndex] = useState(0);
    const filterDataByType = (type) => {
        return rekeningTable.filter((item) => {
            // Ambil angka pertama dari KODE
            const firstDigit = parseInt(item.KODE.charAt(0));
            // Cocokkan dengan jenis aset
            return firstDigit === type;
        });
    };
    const bodyJenisRekening = (rowData) => {
        return <span>{rowData.JENISREKENING == 'I' ? 'INDUK' : 'DETAIL'}</span>;
    };
    // -----------------------------------------------------------------------------------------------------------------< Rekening >
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'KETERANGAN' }
    ];
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            console.log('_lazyState[]', _lazyState['filters']);

            _lazyState['filters'] = { ...lazyState.filters };
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerRekening = (
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
    const toggleRekening = async (event) => {
        setLoadingRekening(true);
        // setRekeningDialog(true);
        try {
            const vaTable = await postData(apiEndPointGetRekening, lazyState);
            const json = vaTable.data;
            setRekeningTable(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingRekening(false);
        }
    };
    const onRowSelectRekening = (event) => {
        const selectedKode = event.data.KODE;
        const selectedRekening = rekeningTable.find((rekening) => rekening.KODE === selectedKode);
        handleRekeningData(selectedRekening.KODE, selectedRekening.KETERANGAN);
        setRekeningDialog(false);
    };
    const jenisRekeningBody = (rowData) => {
        if (rowData.JENISREKENING === 'I') {
            return 'INDUK';
        } else if (rowData.JENISREKENING === 'D') {
            return 'DETAIL';
        } else {
            return rowData.JENISREKENING; // Jika nilai JENISREKENING bukan 'I' atau 'D', kembalikan nilainya seperti biasa
        }
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Rekening  */}
                <Dialog visible={rekeningDialog} header="Rekening" modal className="p-fluid" onHide={() => setRekeningDialog(false)}>
                    <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                        <TabPanel header="ASET">
                            {loading && (
                                <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                </div>
                            )}
                            {!loading && (
                                <DataTable value={filterDataByType(1)} onRowSelect={onRowSelectRekening} selectionMode="single" onPage={onPage} loading={loading} header={headerRekening} className="datatable-responsive" size="small">
                                    <Column field="KODE" header="KODE" />
                                    <Column field="KETERANGAN" header="KETERANGAN" />
                                    <Column field="JENISREKENING" header="JENIS REKENIG" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="KEWAJIBAN">
                            {loading && (
                                <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                </div>
                            )}
                            {!loading && (
                                <DataTable value={filterDataByType(2)} onRowSelect={onRowSelectRekening} selectionMode="single" onPage={onPage} loading={loading} header={headerRekening} className="datatable-responsive" size="small">
                                    <Column field="KODE" header="KODE" />
                                    <Column field="KETERANGAN" header="KETERANGAN" />
                                    <Column field="JENISREKENING" header="JENIS REKENIG" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="MODAL">
                            {loading && (
                                <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                </div>
                            )}
                            {!loading && (
                                <DataTable value={filterDataByType(3)} onRowSelect={onRowSelectRekening} selectionMode="single" onPage={onPage} loading={loading} header={headerRekening} className="datatable-responsive" size="small">
                                    <Column field="KODE" header="KODE" />
                                    <Column field="KETERANGAN" header="KETERANGAN" />
                                    <Column field="JENISREKENING" header="JENIS REKENIG" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="PENDAPATAN">
                            {loading && (
                                <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                </div>
                            )}
                            {!loading && (
                                <DataTable value={filterDataByType(4)} onRowSelect={onRowSelectRekening} selectionMode="single" onPage={onPage} loading={loading} header={headerRekening} className="datatable-responsive" size="small">
                                    <Column field="KODE" header="KODE" />
                                    <Column field="KETERANGAN" header="KETERANGAN" />
                                    <Column field="JENISREKENING" header="JENIS REKENIG" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="BIAYA">
                            {loading && (
                                <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                </div>
                            )}
                            {!loading && (
                                <DataTable value={filterDataByType(5)} onRowSelect={onRowSelectRekening} selectionMode="single" onPage={onPage} loading={loading} header={headerRekening} className="datatable-responsive" size="small">
                                    <Column field="KODE" header="KODE" />
                                    <Column field="KETERANGAN" header="KETERANGAN" />
                                    <Column field="JENISREKENING" header="JENIS REKENIG" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="ADMINISTRATIF">
                            {loading && (
                                <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                </div>
                            )}
                            {!loading && (
                                <DataTable value={filterDataByType(6)} onRowSelect={onRowSelectRekening} selectionMode="single" onPage={onPage} loading={loading} header={headerRekening} className="datatable-responsive" size="small">
                                    <Column field="KODE" header="KODE" />
                                    <Column field="KETERANGAN" header="KETERANGAN" />
                                    <Column field="JENISREKENING" header="JENIS REKENIG" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                    </TabView>
                </Dialog>
            </div>
        </div>
    );
}
