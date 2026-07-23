// GANTI TEKS DI BAWAH INI DENGAN URL GOOGLE SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYy8n7XY82_0HnRJTYFBu3bGITI2GRf7mJ1feNzA2NsO3iuNPH7cPlmqALHB8j8Feeuw/exec";

const daftarGuru = [
    { kode: "IT", nama: "Intan Mauliza Agustina, S.Pd." },
    { kode: "ER", nama: "Erli Maulina, S.Pd." },
    { kode: "MS", nama: "Misrina, S.Pd." },
    { kode: "MA", nama: "Marlina, S.Pd." },
    { kode: "ZF", nama: "Zufrizal, S.Pd." },
    { kode: "DS", nama: "Desiyanti, S.Pd." },
    { kode: "SF", nama: "Safriah, S.pd" },
    { kode: "AG", nama: "Fatimah, S.Ag" },
    { kode: "FA", nama: "Fatimah, S.Ag (FA)" },
    { kode: "RD", nama: "Raidiani, S.Pd." },
    { kode: "MF", nama: "Mutia Farira, S.Pd." }
];

let dataPiket = [];

const bknSekarang = String(new Date().getMonth() + 1).padStart(2, '0');
document.getElementById('filterBulan').value = bknSekarang;
document.getElementById('tgl').valueAsDate = new Date();

async function muatDataDariSheets() {
    try {
        const respon = await fetch(SCRIPT_URL);
        dataPiket = await respon.json();
        document.getElementById('statusLoading').style.display = 'none';
        document.getElementById('btnTambah').disabled = false;
        perbaruiTabelHarian();
        hitungRekap();
    } catch (error) {
        document.getElementById('statusLoading').innerText = "Gagal memuat data. Periksa kembali URL Script Anda.";
    }
}

async function tambahData() {
    const tgl = document.getElementById('tgl').value;
    const kelas = document.getElementById('kelas').value;
    const jamKe = document.getElementById('jamKe').value;
    const guruAbsen = document.getElementById('guruAbsen').value;
    const guruPiket = document.getElementById('guruPiket').value;
    const jtm = parseInt(document.getElementById('jtm').value);

    if(!jamKe) {
        alert("Mohon isi Jam Ke-!");
        return;
    }
    if(guruAbsen === guruPiket) {
        alert("Guru Absen dan Guru Piket tidak boleh orang yang sama!");
        return;
    }

    document.getElementById('btnTambah').disabled = true;
    document.getElementById('statusLoading').innerText = "Mengirim data... silakan tunggu.";
    document.getElementById('statusLoading').style.display = 'block';

    const dataBaru = { tgl, kelas, jamKe, guruAbsen, guruPiket, jtm };

    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(dataBaru)
        });
        
        dataPiket.push(dataBaru);
        perbaruiTabelHarian();
        hitungRekap();

        document.getElementById('jamKe').value = "";
        document.getElementById('statusLoading').style.display = 'none';
    } catch (e) {
        alert("Gagal mengirim data!");
    } finally {
        document.getElementById('btnTambah').disabled = false;
    }
}

function perbaruiTabelHarian() {
    const tbody = document.getElementById('tabelHarian');
    tbody.innerHTML = "";
    dataPiket.forEach(data => {
        let row = `<tr>
            <td>${konversiTanggal(data.tgl)}</td>
            <td>${data.kelas}</td>
            <td>${data.jamKe}</td>
            <td><strong>${data.guruAbsen}</strong></td>
            <td><strong>${data.guruPiket}</strong></td>
            <td>${data.jtm} JTM</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function hitungRekap() {
    const tbodyPiket = document.getElementById('tabelRekapPiket');
    const tbodyAbsen = document.getElementById('tabelRekapAbsen');
    const tarif = parseInt(document.getElementById('tarif').value) || 0;
    const bulanTerpilih = document.getElementById('filterBulan').value;
    
    tbodyPiket.innerHTML = "";
    tbodyAbsen.innerHTML = "";

    const dataTerfilter = dataPiket.filter(d => {
        if (bulanTerpilih === "ALL") return true;
        if (!d.tgl) return false;
        const bulanData = d.tgl.split("-");
        return bulanData[1] === bulanTerpilih;
    });

    daftarGuru.forEach(guru => {
        const totalJTMPiket = dataTerfilter
            .filter(d => d.guruPiket === guru.kode)
            .reduce((sum, d) => sum + d.jtm, 0);
        const totalHonorPiket = totalJTMPiket * tarif;

        if (totalJTMPiket > 0) {
            let rowPiket = `<tr>
                <td><strong>${guru.kode}</strong></td>
                <td>${guru.nama}</td>
                <td>${totalJTMPiket} JTM</td>
                <td style="color: green; font-weight: bold;">Rp ${totalHonorPiket.toLocaleString('id-ID')}</td>
            </tr>`;
            tbodyPiket.innerHTML += rowPiket;
        }

        const totalJTMAbsen = dataTerfilter
            .filter(d => d.guruAbsen === guru.kode)
            .reduce((sum, d) => sum + d.jtm, 0);
        const totalBayarAbsen = totalJTMAbsen * tarif;

        if (totalJTMAbsen > 0) {
            let rowAbsen = `<tr>
                <td><strong>${guru.kode}</strong></td>
                <td>${guru.nama}</td>
                <td>${totalJTMAbsen} JTM</td>
                <td style="color: red; font-weight: bold;">Rp ${totalBayarAbsen.toLocaleString('id-ID')}</td>
            </tr>`;
            tbodyAbsen.innerHTML += rowAbsen;
        }
    });
}

function konversiTanggal(stringTanggal) {
    if(!stringTanggal) return "";
    const opsi = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(stringTanggal).toLocaleDateString('id-ID', opsi);
}

muatDataDariSheets();
