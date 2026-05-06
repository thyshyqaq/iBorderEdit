<script setup>
import { ref } from 'vue'
import exifr from 'exifr'


// 响应式变量存储EXIF数据
const exifData = ref(null)
const errorMsg = ref('')
const isLoading = ref(false);
console.log('exif', exifData)

// 处理文件选择事件
const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 添加加载状态，防止重复触发
    isLoading.value = true;
    try {
        // 调用优化后的函数
        const result = await readExifFromFile(file);
        exifData.value = result.exifData;
        errorMsg.value = result.errorMsg;
    } catch (err) {
        errorMsg.value = '处理文件时发生未知错误';
        exifData.value = null;
    } finally {
        isLoading.value = false; // 无论成功失败，结束加载状态
    }
};

// 读取文件并提取EXIF信息
const readExifFromFile = async (file) => {
    const validImageTypes = ['image/jpeg']; // 明确限定JPG
    if (!file || !validImageTypes.includes(file.type)) {
        return { exifData: null, errorMsg: '请选择JPG格式图片' };
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result;
                if (!arrayBuffer || arrayBuffer.byteLength < 100) { // 排除空数据
                    return resolve({ exifData: null, errorMsg: '文件数据异常' });
                }


                exifr.parse(arrayBuffer, ['LensMake', 'ISO', 'ExposureTime', 'FocalLength']).then((data) => {
                    resolve({ exifData: data, errorMsg: '' });
                }).catch((err) => {
                    console.error('EXIFR解析失败', err);
                    resolve({ exifData: null, errorMsg: 'EXIFR解析失败' });
                });;




            } catch (err) {
                resolve({ exifData: null, errorMsg: `解析失败：${err.message}` });
            }
        };

        reader.onerror = () => resolve({ exifData: null, errorMsg: '文件读取失败' });
        reader.readAsArrayBuffer(file);
    });
};

const exposureTimeTranslate = (eTime) => {
    if (isNaN(eTime) || !isFinite(eTime)) {
        return "无效数据"
    }

    let sign = eTime < 0 ? -1 : '';
    let eTimeAbs = Math.abs(eTime);

    let timeStr = eTimeAbs.toString();
    if (timeStr.includes('e')) {
        const [num, exp] = timeStr.split('e');
        const exponent = parseInt(exp);
        timeStr = num.replace('.', '') + '0'.repeat(Math.abs(exponent) - 1);
    }

    //拆分小数部分和整数部分
    const [intStr, fracStr = ''] = timeStr.split('.');
    //计算分子部分
    const numberator = parseInt(intStr + fracStr);
    //计算分母部分，获取10的小数位次方
    const denominator = Math.pow(10, fracStr.length);

    function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
    }

    const commonDivisor = gcd(numberator, denominator);
    numberator = numberator / commonDivisor;
    const reducedDenominator = denominator / commonDivisor;
    return `${sign}${numberator}/${reducedDenominator}`;
}


</script>

<template>
    <div class="wrapper">
        <h3>图片EXIF信息</h3>
        <input type="file" id="test" accept="image/*" @change="handleFileSelect"
            style="max-width: 400px; margin: 1rem 0;" />


        <!-- 错误信息显示 -->
        <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

        <!-- EXIF数据显示 -->
        <div v-if="exifData" class="exif-container">
            <h4>EXIF详情:</h4>
            <pre class="exif-content">{{ JSON.stringify(exifData, null, 2) }}</pre>
        </div>
    </div>
</template>


<style scoped>
.wrapper {
    padding: 2rem;
    font-family: Arial, sans-serif;
}

.error {
    color: #dc3545;
    background-color: #f8d7da;
    padding: 0.5rem;
    border-radius: 4px;
    margin: 1rem 0;
}

.exif-container {
    margin-top: 1rem;
}

.exif-content {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9rem;
}
</style>