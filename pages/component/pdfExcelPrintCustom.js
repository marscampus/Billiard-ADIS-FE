import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdjustPrintMarginLaporan from './adjustPrintMarginLaporan';
import { Footer, HeaderLaporan } from '../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../component/exportXLSX/exportXLSX';
import PDFViewer from '../../component/jsPDF/PDFViewer';
import AdjustPrintMarginPDF from './adjustPrintMarginPDF';


const PreviewCustom = ({ dataRekap, setDataRekap, toast, handleCustomTable, header, footer, pdfOnly }) => {
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    const btnAdjust = () => {
        console.log(dataRekap.data)
        if (!dataRekap?.data || (Object.entries(dataRekap?.data).length == 0 && dataRekap?.data?.length == 0)) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Data Masih Kosong', life: 3000 });
            setDataRekap((p) => ({ ...p, show: false, adjust: false }));
            return;
        }

        setAdjustDialog(true);
    };

    useEffect(() => {
        if (dataRekap?.show && dataRekap?.adjust) {
            btnAdjust();
        }

    }, [dataRekap?.show, dataRekap?.adjust]);

    useEffect(() => {
        setDataRekap((p) => ({ ...p, show: adjustDialog, adjust: adjustDialog }));

    }, [adjustDialog])

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    useEffect(() => {
        setDataRekap((p) => ({ ...p, load: loadingPreview }));
    }, [loadingPreview])

    const exportPDF = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            const rekapPDF = dataRekap?.data ? JSON.parse(JSON.stringify(dataRekap?.data)) : [];
            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            if (!rekapPDF || rekapPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const judulLaporan = dataRekap?.judul1;
            const periodeLaporan = dataRekap?.judul2;
            if (!header) {
                await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });
            }

            const lastY = await handleCustomTable({ doc, marginTopInMm, marginLeftInMm, marginRightInMm })

            if (!footer) {
                await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2, lastY });
            }
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: error?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        if (dataRekap?.dataExcel?.length > 0) {
            exportToXLSX(dataRekap?.dataExcel, `${dataRekap?.fileName}.xlsx`);
        } else {
            exportToXLSX(dataRekap?.data, `${dataRekap?.fileName}.xlsx`);
        }
    };

    return (
        <>
            {pdfOnly ?
                <AdjustPrintMarginPDF adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} />
                :
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} excel={exportExcel} />
            }
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} fileName={dataRekap?.filename} />
                </div>
            </Dialog>
        </>
    );
};

export default PreviewCustom;
