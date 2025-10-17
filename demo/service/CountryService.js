import getConfig from 'next/config';

// export const CountryService = {
//     getCountries: () => {
//       return new Promise((resolve) => {
//         // Contoh pengambilan data dari API atau sumber data lainnya
//         setTimeout(() => {
//           const countries = [
//             { id: 1, name: 'Indonesia' },
//             { id: 2, name: 'Malaysia' },
//             { id: 3, name: 'Singapura' },
//             { id: 4, name: 'Korea Selatan' },
//             // ... daftar negara lainnya
//           ];
//           resolve(countries);
//         }, 1000);
//       });
//     }
//   };
export class CountryService {
    constructor() {
        this.contextPath = getConfig().publicRuntimeConfig.contextPath;
    }

    getCountries() {
        return fetch(this.contextPath + '/demo/data/countries.json', { headers: { 'Cache-Control': 'no-cache' } })
            .then((res) => res.json())
            .then((d) => d.data);
    }
}
