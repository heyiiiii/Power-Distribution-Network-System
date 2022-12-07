<template>
    <div>
        <el-dialog :title="title" :visible="visible" width="870px" :before-close="beforeClose">
            <table class="sel-table">
                <tbody>
                    <tr>
                        <th>首字母</th>
                        <td>
                            <el-radio-group v-model="initial" @change="onChangeInitial">
                                <el-radio-button v-for="(letter, index) of initials" :label="letter" :key="index">
                                    {{ letter }}
                                </el-radio-button>
                            </el-radio-group>
                        </td>
                    </tr>
                    <tr>
                        <th>地区</th>
                        <td>
                            <el-checkbox :indeterminate="checkBox.indeterminate" v-model="checkBox.checkAll"
                                type="success" class="clear-line" @change="onChangeCheckAllAreas">
                                全选
                            </el-checkbox>
                            <el-checkbox-group v-model="checkBox.checkedAreas" @change="onChangeCheckedAreas">
                                <el-checkbox v-for="area in areas" :key="area" :label="area">
                                    {{ area === '' ? '无' : area }}
                                </el-checkbox>
                            </el-checkbox-group>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="list-content">
                <div v-for="(row, rowIndex) in substationTable" :key="rowIndex">
                    <div class="sel-row-button">
                        <el-button v-for="(sub, index) in row" :key="index" @click="onClickSubstation(sub)"
                            class="sel-sub-button">
                            <span :title="sub.name">{{ sub.name }}</span>
                        </el-button>
                    </div>
                </div>
            </div>
            <el-collapse-transition>
                <div v-if="showTable">
                    <el-table :data="busList" size="mini" class="m-t-20">
                        <el-table-column prop="name" label="母线名称" />
                    </el-table>
                    <el-table :data="lineList" size="mini" class="m-t-20">
                        <el-table-column prop="name" label="线路名称">
                            <template slot-scope="scope">
                                <span>{{ formatLineName(scope.row) }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="busName" label="所属线路" />
                        <el-table-column label="操作">
                            <template slot-scope="scope">
                                <span class="sel-span-font" @click="onOpenGraph(scope.row)">选择线路</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </el-collapse-transition>
            <el-pagination background @current-change="handleCurrentChange" :current-page="page.current"
                :page-size="page.size" layout="total, prev, pager, next, jumper" :total="page.count">
            </el-pagination>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'selector-linestation',
    props: {
        title: {
            type: String,
            default: '检索'
        },
        visible: {
            type: Boolean,
            default: false
        },
        // ,
        rowData: {
            type: Array,
            default: null
        }
    },
    data() {
        return {
            initial: '全部',
            copySubstationList: [],
            substationList: [],
            busList: [],
            lineList: [],
            ctBreakerData: {},
            resultData: null,
            checkBox: {
                checkAll: true,
                indeterminate: true,
                checkedAreas: []
            },
            page: {
                size: 42,
                count: 10,
                current: 1,
                params: {}
            },
            showTable: false,
            currentSelectedSub: '',
            filterRowdata: []
        };
    },
    computed: {
        initials() {
            const set = new Set();
            for (const sub of this.copySubstationList) {
                set.add(...sub.name.getFirstLetters());
            }
            const map = Array.from(set.values()).sort((x, y) => x ? x.localeCompare(y) : 0);
            return ['全部', ...map];
        },
        substationTable() {
            const map = new Map();
            this.substationList.forEach((value, index) => {
                const key = Math.ceil((index + 1) / 6);
                const beforeList = map.get(key) || [];
                map.set(key, [...beforeList, value]);
            });
            return Array.from(map.values());
        },
        areas() {
            return [];
        }
    },
    mounted() {
        this.getSubstationList();
    },
    created() {
        this.ctBreakerData = this.rowData;
    },
    methods: {
        async getSubstationList() {
            const { data } = await this.$axios.post('/models/substation/list');
            const { succ = null, result = null } = data;
            if (!succ) {
                this.$message.error('获取厂站异常');
                return;
            }
            const { count, rows = [] } = result;
            this.substationList = rows;
            this.copySubstationList = JSON.parse(JSON.stringify(rows));
            this.page.count = count;
            this.handleCurrentChange(1);
        },
        onChangeInitial() {
            this.handleCurrentChange(1);
        },
        onChangeCheckAllAreas() {

        },
        onChangeCheckedAreas() {
        },
        async onClickSubstation({ _id, buses }) {
            if (this.currentSelectedSub === _id) {
                this.showTable = false;
                this.currentSelectedSub = '';
                return;
            }
            this.showTable = true;
            this.currentSelectedSub = _id;
            await this.getBusAndLine(buses);
        },
        handleCurrentChange(val) {
            const initialList = this.initial === '全部'
                ? JSON.parse(JSON.stringify(this.copySubstationList))
                : this.copySubstationList.filter(x => x.name.getFirstLetters()[0] === this.initial);
            this.substationList = initialList.slice((val - 1) * this.page.size, val * this.page.size);
            this.page.count = initialList.length;
        },
        // 获取母线和线路
        async getBusAndLine(buses) {
            // 获取母线
            const { data: busData } = await this.$axios.post('/models/bus/list', buses);
            if (!busData.succ) {
                this.$message.error('获取母线异常');
                return;
            }
            this.busList = busData.result;

            // 获取线路
            const lineError = [];
            const lines = [];
            for (const bus of busData.result) {
                const { data: lineData } = await this.$axios.post('/models/line/list', bus.lines);
                if (!lineData.succ) {
                    lineError.push(`获取${bus.name}的线路异常`);
                    continue;
                }
                // 所属母线名称赋值
                lineData.result.forEach(x => {
                    x.busName = bus.name;
                });

                lines.push(...lineData.result);
            }
            if (lineError.length > 0) {
                this.$message.error('获取部分线路异常');
                console.log(lineError);
            }
            this.lineList = lines;
            console.log('this_is_linelist:\n');
            console.log(this.lineList);
        },
        formatLineName({ name, belong }) {
            let lineName = '';
            switch (belong) {
                case 'city': {
                    lineName = `${name}(城网)`;
                    break;
                }
                case 'village': {
                    lineName = `${name}(农网)`;
                    break;
                }
                default: {
                    lineName = name;
                }
            }
            return lineName;
        },
        async onOpenGraph(line) {
            const lineid = [line._id];
            const data = await this.$axios.$post('/models/breaker/lineid/list', lineid);
            if (!data || !data.succ) {
                this.$message.error('获取线路上的断路器失败');
                return;
            }
            this.resultData = data.result;
            this.$emit('update:visible', false);
            this.$emit('update:hasFilterData', true);
            this.$emit('resultData', this.resultData);
        },
        beforeClose() {
            this.$emit('update:visible', false);
        }
    }
};
</script>

<style scoped>
.sel-table {
    border-collapse: separate;
    border-spacing: 6px 2px;
}

.list-content {
    width: 100%;
    height: 300px;
    overflow: auto;
    border-top: 1px solid grey;
    border-bottom: 1px solid grey;
    padding-top: 5px;
    padding-bottom: 5px;
}

.sel-sub-button {
    width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sel-row-button {
    margin: 10px 0;
}

.sel-span-font {
    cursor: pointer;
    color: #055EBA;
}
</style>
