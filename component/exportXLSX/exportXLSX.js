import * as XLSX from 'xlsx';

// Fungsi untuk membagi teks panjang menjadi beberapa bagian
const splitLongText = (text, maxLength) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.substring(i, i + maxLength));
    }
    return chunks;
};

export const exportToXLSX = (data, filename) => {
    const MAKS_PANJANG_SEL = 32767;

    try {
        if (data.length > 0) {
            // Mengonversi data JSON ke dalam format Excel
            const wb = XLSX.utils.book_new();
            const modifiedData = data.map((entry) => {
                const { File, ...cleanedEntry } = entry;
                const newEntry = {};

                for (let key in cleanedEntry) {
                    if (typeof cleanedEntry[key] === 'string' && cleanedEntry[key].length > MAKS_PANJANG_SEL) {
                        // Membagi teks panjang menjadi beberapa bagian
                        const chunks = splitLongText(cleanedEntry[key], MAKS_PANJANG_SEL);
                        chunks.forEach((chunk, index) => {
                            newEntry[`${key}_part${index + 1}`] = chunk;
                        });
                    } else {
                        newEntry[key] = cleanedEntry[key];
                    }
                }
                return newEntry;
            });

            const ws = XLSX.utils.json_to_sheet(modifiedData);
            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            XLSX.writeFile(wb, filename);
        } else {
            console.error('Data Kosong');
        }
    } catch (error) {
        console.error('Error mengekspor XLSX:', error);
    }
};
