import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';
import { showError } from '../../component/GeneralFunction/GeneralFunction';

export default function Supervisor({ supervisorDialog, setSupervisorDialog, btnSupervisor, handleSupervisorData }) {
    const apiEndPointGetSupervisor = '/api/shift_kasir/select_kasir';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingSupervisor, setLoadingSupervisor] = useState(false);
    const [supervisorTabel, setSupervisorTabel] = useState(null);
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
        if (supervisorDialog && btnSupervisor) {
            toggleSupervisor();
        }
    }, [supervisorDialog, btnSupervisor, lazyState]);

    const loadLazyData = async () => {
        setLoadingSupervisor(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetSupervisor
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetSupervisor, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setSupervisorTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            console.error('error', e.message);
        } finally {
            setLoadingSupervisor(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< Supervisor >
    const dropdownValues = [
        { name: 'USERNAME', label: 'USERNAME' },
        { name: 'FULLNAME', label: 'FULLNAME' }
    ];
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            console.log('_lazyState[]', _lazyState['filters']);

            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerSupervisor = (
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
    const toggleSupervisor = async (event) => {
        setLoadingSupervisor(true);
        // setSupervisorDialog(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetSupervisor
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetSupervisor, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setSupervisorTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingSupervisor(false);
        }
        setLoadingSupervisor(false);
    };
    const onRowSelectSupervisor = (event) => {
        const selectedKode = event.data.USERNAME;
        const selectedSupervisor = supervisorTabel.find((supervisor) => supervisor.USERNAME === selectedKode);
        handleSupervisorData(selectedSupervisor.USERNAME, selectedSupervisor.FULLNAME);
        setSupervisorDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Supervisor  */}
                <Dialog visible={supervisorDialog} header="Supervisor" modal className="p-fluid" onHide={() => setSupervisorDialog(false)}>
                    <DataTable
                        size="small"
                        value={supervisorTabel}
                        lazy
                        dataKey="KODE"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loadingSupervisor}
                        header={headerSupervisor}
                        onRowSelect={onRowSelectSupervisor}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="USERNAME" header="USERNAME"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="FULLNAME" header="FULLNAME"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}
