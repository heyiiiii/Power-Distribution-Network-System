<template>
  <div>
    <split-left-right :height="contentHeight" sid="10kV-model-l-r-1">
      <div slot="left">
        <!--        <split-top-bottom :height="contentHeight" sid="cim-model-t-b">-->
        <!--          <div slot="top" slot-scope="{height}">-->
        <!--            <el-card>-->
        <!--              <div slot="header">-->
        <!--                <span>厂站</span>-->
        <!--              </div>-->
        <!--              <ag-grid-vue-->
        <!--                :modules="$agGridModules"-->
        <!--                class="ag-theme-balham clear-line"-->
        <!--                :style="{height: height - 70 + 'px'}"-->
        <!--                :gridOptions="gridOptions"-->
        <!--                :columnDefs="columnDefs"-->
        <!--                :rowData="gridRowData"-->
        <!--                @grid-ready="onGridReady"-->
        <!--              />-->
        <!--            </el-card>-->
        <!--          </div>-->
        <!--          <div slot="bottom" slot-scope="{height}">-->
        <!--            <el-card>-->
        <!--              <div slot="header">-->
        <!--                <span>母线及线路</span>-->
        <!--              </div>-->
        <!--              <el-tree-->
        <!--                ref="tree"-->
        <!--                :data="treeData"-->
        <!--                node-key="_id"-->
        <!--                :style="{height: height - 70 + 'px'}"-->
        <!--                accordion-->
        <!--                highlight-current-->
        <!--                @node-click="onClickTreeNode"-->
        <!--                :default-expand-all="true"-->
        <!--                :expand-on-click-node="false">-->
        <!--                <span class="custom-tree-node" slot-scope="{ node, data }">-->
        <!--                  <span>{{ data.name }}</span>-->
        <!--                  <span v-if="node.level === 1">-->
        <!--                    <el-tooltip content="编辑" placement="top-end">-->
        <!--                      <el-button type="text" icon="el-icon-edit" @click="openBusEditDialog(data)" />-->
        <!--                    </el-tooltip>-->
        <!--                    <el-tooltip content="删除" placement="top-end">-->
        <!--                      <el-button class="color-red" type="text" icon="el-icon-delete" @click="onDeleteBus(data)" />-->
        <!--                    </el-tooltip>-->
        <!--                  </span>-->
        <!--                  <span v-else-if="node.level === 2">-->
        <!--                    <el-tooltip content="编辑" placement="top-end">-->
        <!--                      <el-button type="text" icon="el-icon-edit" @click="openLineEditDialog(data)" />-->
        <!--                    </el-tooltip>-->
        <!--                    <el-tooltip content="删除" placement="top-end">-->
        <!--                      <el-button class="color-red" type="text" icon="el-icon-delete" @click="onDeleteLine(data)" />-->
        <!--                    </el-tooltip>-->
        <!--                  </span>-->
        <!--                </span>-->
        <!--              </el-tree>-->
        <!--            </el-card>-->
        <!--          </div>-->
        <!--        </split-top-bottom>-->
      </div>
      <div slot="right" slot-scope="{height}">
        <graph ref="graph" :panelHeight="height" :uri="editInfo._id" :data="graphData" :svg="svg"
          @on-select-link="onSelectLink" @on-select-svg="onSelectSvg" @on-calculate="onCalculate"
          @on-general-calculate="onGeneralCalculate" />
        <split-left-right :height="height" sid="10kV-model-l-r-2">
          <div slot="left"></div>
          <div slot="right" class="padding-left-5 padding-top-5" style="display: none"></div>
        </split-left-right>
      </div>
    </split-left-right>
    <!-- 厂站弹框 -->
    <el-dialog :title="substationDialog.title" :visible.sync="substationDialog.visible" :modal="false" width="500px">
      <el-form ref="substationForm" :model="substationForm" :rules="substationRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="substationForm.name" />
        </el-form-item>
        <el-form-item label="电压等级" prop="voltage">
          <el-select v-model.trim="substationForm.voltage">
            <el-option v-for="item in voltages" :key="item.svg" :label="item.name" :value="item.svg" />
          </el-select>
        </el-form-item>
        <el-form-item label="变电站类型" prop="subType">
          <el-select v-model.trim="substationForm.subType">
            <el-option v-for="item in substationSubTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="state">
          <el-select v-model.trim="substationForm.state" placeholder="请选择">
            <el-option v-for="item in substationStateOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="上次检修时间" prop="maintainTime">
          <el-input v-model.trim="substationForm.maintainTime" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model.trim="substationForm.description" type="textarea" :rows="2" placeholder="请输入厂站描述" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="substationDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmSubstation">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 母线弹框 -->
    <el-dialog :title="busDialog.title" :visible.sync="busDialog.visible" :modal="false" width="500px">
      <el-form ref="busForm" :model="busForm" :rules="busRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="busForm.name" />
        </el-form-item>
        <!--        <el-form-item label="电压等级" prop="voltage">-->
        <!--          <el-select v-model.trim="busForm.voltage">-->
        <!--            <el-option v-for="item in voltages" :key="item.svg" :label="item.name" :value="item.svg" />-->
        <!--          </el-select>-->
        <!--        </el-form-item>-->
        <el-form-item label="描述" prop="description">
          <el-input v-model.trim="busForm.description" type="textarea" :rows="2" placeholder="请输入母线描述" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="busDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmBus">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 线路弹框 -->
    <el-dialog :title="lineDialog.title" :visible.sync="lineDialog.visible" :modal="false" width="500px">
      <el-form ref="lineForm" :model="lineForm" :rules="lineRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="lineForm.name" />
        </el-form-item>
        <el-form-item label="开断电流" prop="cutA">
          <el-input v-model.trim="lineForm.cutA" type="number" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model.trim="lineForm.description" type="textarea" :rows="2" placeholder="请输入母线描述" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="lineDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmLine">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 线路段弹框 -->
    <el-dialog :title="lineSegmentDialog.title" :visible.sync="lineSegmentDialog.visible" :modal="false" width="570px">
      <el-form ref="lineSegmentForm" :model="lineSegmentForm" :rules="lineSegmentRules" label-width="115px">
        <el-form-item label="起始端" prop="segment.startDeviceId">
          <el-select v-model.trim="lineSegmentForm.segment.startDeviceId">
            <el-option v-for="item in startDeviceList" :key="item._id" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="终止端" prop="segment.endDeviceType">
          <span class="radio-group">
            <template v-for="item in endDeviceRadioOptions">
              <el-radio class="radio-height" v-model="lineSegmentForm.segment.endDeviceType"
                @change="onRadioChange(item)" :label="item.label" :key="item.label">
                {{item.name}}
              </el-radio>
            </template>
          </span>
        </el-form-item>
        <!-- 杆塔 -->
        <template v-if="lineSegmentForm.segment.endDeviceType === device.tower.label">
          <el-form-item label="杆塔名称" prop="tower.name">
            <el-input v-model.trim="lineSegmentForm.tower.name" :validate-event="false" />
          </el-form-item>
        </template>
        <!-- 开关 -->
        <template v-else-if="lineSegmentForm.segment.endDeviceType === device.breaker.label">
          <el-form-item label="开关类型" prop="breaker.breakerType">
            <el-select v-model.trim="lineSegmentForm.breaker.breakerType">
              <el-option v-for="item in breakerTypeOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </template>
        <template v-if="lineSegmentForm.segment.endDeviceType === device.breaker.label">
          <el-form-item label="开关名称" prop="breaker.name">
            <el-input v-model.trim="lineSegmentForm.breaker.name" :validate-event="false" />
          </el-form-item>
        </template>
        <!-- 负荷 -->
        <template v-else-if="lineSegmentForm.segment.endDeviceType === device.load.label">
          <el-form-item label="负荷名称" prop="load.name">
            <el-input v-model.trim="lineSegmentForm.load.name" :validate-event="false" />
          </el-form-item>
        </template>
        <!-- 连接点 -->
        <template v-else-if="lineSegmentForm.segment.endDeviceType === device.tpoint.label">
          <el-form-item label="连接点名称" prop="tpoint.name">
            <el-input v-model.trim="lineSegmentForm.tpoint.name" :validate-event="false" />
          </el-form-item>
        </template>
        <!-- 变压器 -->
        <template v-else-if="lineSegmentForm.segment.endDeviceType === device.transformer.label">
          <el-form-item label="变压器名称" prop="transformer.name">
            <el-input v-model.trim="lineSegmentForm.transformer.name" :validate-event="false" />
          </el-form-item>
          <el-form-item label="容量(KVA)" prop="transformer.capacity">
            <el-input v-model.trim="lineSegmentForm.transformer.capacity" type="number" :min="0"
              :validate-event="false" />
          </el-form-item>
        </template>
        <template v-if="lineSegmentForm.segment.endDeviceType === device.transformer.label">
          <el-form-item label="UK%" prop="transformer.uk">
            <el-input v-model.trim="lineSegmentForm.transformer.uk" type="number" :min="0" :validate-event="false" />
          </el-form-item>
        </template>
        <el-form-item label="参数" prop="">
          <span class="radio-group">
            <template v-for="item in paramsRadioOptions">
              <el-radio class="radio-height" v-model="lineSegmentForm.segment.lineType" @change="onRadioChange(item)"
                :label="item.label" :key="item.label">
                {{item.name}}
              </el-radio>
            </template>
          </span>
        </el-form-item>
        <!-- 架空线和电缆 -->
        <template v-if="lineSegmentForm.segment.lineType">
          <template v-if="lineSegmentForm.segment.lineType === 'overhead'">
            <el-form-item label="是否存在" prop="segment.ground">
              <el-checkbox v-model="lineSegmentForm.segment.ground">架空地线</el-checkbox>
            </el-form-item>
            <el-form-item prop="segment.circuit">
              <el-checkbox v-model="lineSegmentForm.segment.circuit">同杆塔双回线</el-checkbox>
            </el-form-item>
          </template>
          <el-form-item label="导线型号" prop="segment.conductorType">
            <el-select v-model.trim="lineSegmentForm.segment.conductorType">
              <el-option v-for="item in conductorTypes" :key="item._id" :label="item.name" :value="item._id" />
            </el-select>
          </el-form-item>
          <el-form-item label="长度（km）" prop="segment.length">
            <el-input v-model.trim="lineSegmentForm.segment.length" type="number" :min="0" :validate-event="false" />
          </el-form-item>
          <el-form-item label="截面积（mm）" prop="segment.sectionSurface">
            <el-input v-model.trim="lineSegmentForm.segment.sectionSurface" type="number" :min="0"
              :validate-event="false" />
          </el-form-item>
        </template>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="lineSegmentDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmSegment">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="segmentEditDialog.title" :visible.sync="segmentEditDialog.visible" :modal="false" width="500px">
      <el-form ref="segmentForm" :model="segmentForm" :rules="segmentRules" label-width="115px">
        <el-form-item label="名称" prop="name">
          <span>{{ selectedRow.startDeviceName + '-' + selectedRow.endDeviceName }}</span>
        </el-form-item>
        <el-form-item label="参数" prop="">
          <span class="radio-group">
            <template v-for="item in paramsRadioOptions">
              <el-radio class="radio-height" v-model="segmentForm.lineType" @change="onEditRadioChange(item)"
                :label="item.label" :key="item.label">
                {{item.name}}
              </el-radio>
            </template>
          </span>
        </el-form-item>
        <template v-if="segmentForm.lineType">
          <template v-if="segmentForm.lineType === 'overhead'">
            <el-form-item label="是否存在" prop="ground">
              <el-checkbox v-model="segmentForm.ground">架空地线</el-checkbox>
            </el-form-item>
            <el-form-item prop="circuit">
              <el-checkbox v-model="segmentForm.circuit">同杆塔双回线</el-checkbox>
            </el-form-item>
          </template>
          <el-form-item label="导线型号" prop="conductorType">
            <el-select v-model.trim="segmentForm.conductorType">
              <el-option v-for="item in conductorTypes" :key="item._id" :label="item.name" :value="item._id" />
            </el-select>
          </el-form-item>
          <el-form-item label="长度（km）" prop="length">
            <el-input v-model.trim="segmentForm.length" type="number" :min="0" :validate-event="false" />
          </el-form-item>
          <el-form-item label="截面积（mm）" prop="sectionSurface">
            <el-input v-model.trim="segmentForm.sectionSurface" type="number" :min="0" :validate-event="false" />
          </el-form-item>
        </template>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="segmentEditDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onSegmentEdit">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="segmentInsertDialog.title" :visible.sync="segmentInsertDialog.visible" :modal="false"
      width="500px">
      <el-form ref="segmentInsertForm" :model="segmentInsertForm" :rules="lineSegmentRules" label-width="115px">
        <el-form-item label="插入位置" prop="name">
          <span>{{ selectedRow.startDeviceName }}</span>
        </el-form-item>
        <el-form-item label="插入类型" prop="segment.endDeviceType">
          <span class="radio-group">
            <template v-for="item in insertRadioOptions">
              <el-radio class="radio-height" v-model="segmentInsertForm.segment.endDeviceType"
                @change="onInsertRadioChange(item)" :label="item.label" :key="item.label">
                {{item.name}}
              </el-radio>
            </template>
          </span>
        </el-form-item>
        <!-- 杆塔 -->
        <template v-if="segmentInsertForm.segment.endDeviceType === 'tower'">
          <el-form-item label="杆塔名称" prop="tower.name">
            <el-input v-model.trim="segmentInsertForm.tower.name" :validate-event="false" />
          </el-form-item>
        </template>
        <!-- 开关 -->
        <template v-else-if="segmentInsertForm.segment.endDeviceType === 'breaker'">
          <el-form-item label="开关类型" prop="breaker.breakerType">
            <el-select v-model.trim="segmentInsertForm.breaker.breakerType">
              <el-option v-for="item in breakerTypeOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="开关名称" prop="breaker.name">
            <el-input v-model.trim="segmentInsertForm.breaker.name" :validate-event="false" />
          </el-form-item>
        </template>
        <el-form-item label="参数" prop="">
          <span class="radio-group">
            <template v-for="item in paramsRadioOptions">
              <el-radio class="radio-height" v-model="segmentInsertForm.segment.lineType"
                @change="onInsertRadioChange(item)" :label="item.label" :key="item.label">
                {{item.name}}
              </el-radio>
            </template>
          </span>
        </el-form-item>
        <template v-if="segmentInsertForm.segment.lineType">
          <template v-if="segmentInsertForm.segment.lineType === 'overhead'">
            <el-form-item label="是否存在" prop="segment.ground">
              <el-checkbox v-model="segmentInsertForm.segment.ground">架空地线</el-checkbox>
            </el-form-item>
            <el-form-item prop="segment.circuit">
              <el-checkbox v-model="segmentInsertForm.segment.circuit">同杆塔双回线</el-checkbox>
            </el-form-item>
          </template>
          <el-form-item label="导线型号" prop="segment.conductorType">
            <el-select v-model.trim="segmentInsertForm.segment.conductorType">
              <el-option v-for="item in conductorTypes" :key="item._id" :label="item.name" :value="item._id" />
            </el-select>
          </el-form-item>
          <el-form-item label="长度（km）" prop="segment.length">
            <el-input v-model.trim="segmentInsertForm.segment.length" type="number" :min="0" :validate-event="false" />
          </el-form-item>
          <el-form-item label="截面积（mm）" prop="segment.sectionSurface">
            <el-input v-model.trim="segmentInsertForm.segment.sectionSurface" type="number" :min="0"
              :validate-event="false" />
          </el-form-item>
        </template>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="segmentInsertDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmInsert">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 开关 -->
    <el-dialog :title="breaker.dialog.title" :visible.sync="breaker.dialog.visible" :modal="false" width="550px">
      <el-form ref="breakerForm" :model="breaker.form" :rules="breaker.rules" label-width="150px">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="breaker.form.name" disabled />
        </el-form-item>
        <el-form-item label="控制器型号" prop="ctrlModelNumber">
          <el-input v-model.trim="breaker.form.ctrlModelNumber" />
        </el-form-item>
        <el-form-item label="零序CT一次值" prop="ct01">
          <el-input v-model.trim="breaker.form.ct01" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="零序CT二次值" prop="ct02">
          <el-input v-model.trim="breaker.form.ct02" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="零序CT精度" prop="ct0Precision">
          <el-input v-model.trim="breaker.form.ct0Precision" />
        </el-form-item>
        <el-form-item label="正序CT一次值" prop="ct11">
          <el-input v-model.trim="breaker.form.ct11" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="正序CT二次值" prop="ct12">
          <el-input v-model.trim="breaker.form.ct12" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="正序CT精度" prop="ct1Precision">
          <el-input v-model.trim="breaker.form.ct1Precision" />
        </el-form-item>
        <el-form-item label="总配变容量(kVA)" prop="totalCapacity">
          <el-input v-model.trim="breaker.form.totalCapacity" type="number" :min="0" disabled />
        </el-form-item>
        <el-form-item label="最大配变容量(kVA)" prop="maxCapacity">
          <el-input v-model.trim="breaker.form.maxCapacity" type="number" :min="0" disabled />
        </el-form-item>
        <el-form-item label="最大电动机容量(kVA)" prop="maxMotorCapacity">
          <el-input v-model.trim="breaker.form.maxMotorCapacity" type="number" :min="0" disabled />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model.trim="breaker.form.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="breaker.dialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmBreaker">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 变压器 -->
    <el-dialog :title="transformer.dialog.title" :visible.sync="transformer.dialog.visible" :modal="false"
      width="500px">
      <el-form ref="transformerForm" :model="transformer.form" :rules="transformer.rules" label-width="150px">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="transformer.form.name" disabled />
        </el-form-item>
        <el-form-item label="UK百分比" prop="uk">
          <el-input v-model.trim="transformer.form.uk" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="容量" prop="capacity">
          <el-input v-model.trim="transformer.form.capacity" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model.trim="transformer.form.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="transformer.dialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmTransformer">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 线路段 -->
    <el-dialog :title="segment.dialog.title" :visible.sync="segment.dialog.visible" :modal="false" width="500px">
      <el-form ref="acSegmentForm" :model="segment.form" :rules="segment.rules" label-width="150px">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="segment.form.name" disabled />
        </el-form-item>
        <el-form-item label="长度（km）" prop="length">
          <el-input v-model.trim="segment.form.length" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="截面积（mm）" prop="sectionSurface">
          <el-input v-model.trim="segment.form.sectionSurface" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="正序电阻（Ω）" prop="valR1">
          <el-input v-model.trim="segment.form.valR1" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="正序电抗（Ω）" prop="valX1">
          <el-input v-model.trim="segment.form.valX1" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="零序电阻（Ω）" prop="valR0">
          <el-input v-model.trim="segment.form.valR0" type="number" :min="0" />
        </el-form-item>
        <el-form-item label="零序电抗（Ω）" prop="valX0">
          <el-input v-model.trim="segment.form.valX0" type="number" :min="0" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="segment.dialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmAcSegment">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 脚本组件 -->
    <Script ref="script" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Globals from '../../assets/js/globals';
import SplitLeftRight from '~/components/splite/leftRight';
import SplitTopBottom from '~/components/splite/topBottom';
import Script from '~/components/tscript';
import Graph from '~/components/graph/svg';

const numberValidator = {
  validator: (rule, value, callback) => {
    if (isNaN(value)) {
      callback(new Error('请输入一个合法的数值'));
    }
    if (value < 0) {
      callback(new Error('不可为小于0'));
    }
    callback();
  },
  trigger: 'blur'
};

export default {
  name: 'cim-model',
  head() {
    return {
      title: this.currentRouteText
    };
  },
  components: {
    SplitLeftRight,
    SplitTopBottom,
    Script,
    Graph
  },
  data() {
    return {
      breaker: {
        dialog: {
          id: '',
          title: '',
          visible: false
        },
        form: {
          name: '',
          ctrlModelNumber: '',
          ct01: '',
          ct02: '',
          ct0Precision: '',
          ct11: '',
          ct12: '',
          ct1Precision: '',
          totalCapacity: '',
          maxCapacity: '',
          maxMotorCapacity: '',
          description: ''
        },
        rules: {
          name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
          ct01: [numberValidator],
          ct02: [numberValidator],
          ct11: [numberValidator],
          ct12: [numberValidator],
          totalCapacity: [numberValidator],
          maxCapacity: [numberValidator],
          maxMotorCapacity: [numberValidator]
        }
      },
      transformer: {
        dialog: {
          id: '',
          title: '',
          visible: false
        },
        form: {
          name: '',
          uk: '',
          capacity: '',
          description: ''
        },
        rules: {
          name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
          uk: [numberValidator],
          capacity: [numberValidator]
        }
      },
      segment: {
        dialog: {
          id: '',
          title: '',
          visible: false
        },
        form: {
          name: '',
          conductorType: '',
          length: '',
          sectionSurface: '',
          valR1: '',
          valX1: '',
          valR0: '',
          valX0: ''
        },
        rules: {
          name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
          length: [numberValidator],
          sectionSurface: [numberValidator],
          valR1: [numberValidator],
          valX1: [numberValidator],
          valR0: [numberValidator],
          valX0: [numberValidator]
        }
      },
      substationDialog: {
        id: '',
        title: '',
        visible: false
      },
      substationForm: {
        name: '',
        voltage: '',
        subType: '',
        state: '',
        description: '',
        maintainTime: ''
      },
      substationRules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
      },
      substationSubTypeOptions: ['变电站', '火电厂', '开关站', '风电厂', '水电站', '核电站', '光伏电站', '抽水蓄能'],
      substationStateOptions: ['未建设', '已建设', '投运', '检修', '退运', '销毁'],
      busDialog: {
        id: '',
        title: '',
        visible: false
      },
      busForm: {
        name: '',
        description: ''
      },
      busRules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
      },
      lineDialog: {
        id: '',
        title: '',
        visible: false
      },
      lineForm: {
        name: '',
        cutA: '',
        description: ''
      },
      lineRules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
      },
      lineSegmentDialog: {
        id: '',
        title: '',
        visible: false
      },
      lineSegmentForm: {
        segment: {
          lineType: 'overhead',
          conductorType: '',
          ground: false,
          circuit: false,
          length: '',
          sectionSurface: '',
          startDeviceId: '',
          endDeviceType: 'tower',
          valR0: ''
        },
        tower: {
          name: ''
        },
        breaker: {
          name: '',
          breakerType: ''
        },
        load: {
          name: ''
        },
        tpoint: {
          name: ''
        },
        transformer: {
          name: '',
          uk: '',
          capacity: ''
        },
        overhead: {
          conductorType: '',
          length: ''
        }
      },
      lineSegmentRules: {
        'segment.startDeviceId': [{ required: true, message: '请选择起始端', trigger: 'blur' }],
        'tower.name': [{ required: true, message: '请输入杆塔名称', trigger: 'blur' }],
        'breaker.breakerType': [{ required: true, message: '请选择开关类型', trigger: 'blur' }],
        'breaker.name': [{ required: true, message: '请输入开关名称', trigger: 'blur' }],
        'load.name': [{ required: true, message: '请输入负荷名称', trigger: 'blur' }],
        'tpoint.name': [{ required: true, message: '请输入连接点名称', trigger: 'blur' }],
        'transformer.name': [{ required: true, message: '请输入变压器名称', trigger: 'blur' }],
        'transformer.uk': [
          { required: true, message: '请输入UK', trigger: 'blur' },
          numberValidator
        ],
        'transformer.capacity': [
          { required: true, message: '请输入容量', trigger: 'blur' },
          numberValidator
        ],
        'segment.conductorType': [{ required: true, message: '请选择导线型号', trigger: 'blur' }],
        'segment.sectionSurface': [
          { required: true, message: '请输入截面积', trigger: 'blur' },
          numberValidator
        ],
        'segment.length': [
          { required: true, message: '请输入长度', trigger: 'blur' },
          numberValidator
        ],
        'segment.valR0': [{ required: true, message: '请输入给定阻抗', trigger: 'blur' }]
      },
      segmentEditDialog: {
        id: '',
        title: '',
        visible: false
      },
      segmentForm: {
        lineType: 'overhead',
        conductorType: '',
        ground: false,
        circuit: false,
        length: '',
        sectionSurface: ''
      },
      segmentRules: {
        conductorType: [{ required: true, message: '请选择导线型号', trigger: 'blur' }],
        sectionSurface: [
          { required: true, message: '请输入截面积', trigger: 'blur' },
          numberValidator
        ],
        length: [
          { required: true, message: '请输入长度', trigger: 'blur' },
          numberValidator
        ]
      },
      segmentInsertDialog: {
        id: '',
        title: '',
        visible: false
      },
      segmentInsertForm: {
        segment: {
          lineType: 'overhead',
          conductorType: '',
          ground: false,
          circuit: false,
          length: '',
          sectionSurface: '',
          endDeviceType: 'tower',
          valR0: ''
        },
        tower: {
          name: ''
        },
        breaker: {
          name: '',
          breakerType: ''
        }
      },
      breakerTypeOptions: ['分段开关', '分界开关', '环网柜'],
      startDeviceList: [],
      paramsRadioOptions: [{
        name: '架空线',
        label: 'overhead'
      }, {
        name: '电缆',
        label: 'cable'
      }],
      gridApi: '',
      gridRowData: [],
      columnDefs: [
        {
          headerName: '',
          suppressMenu: true,
          width: 50,
          cellRenderer: params => {
            return params.rowIndex + 1;
          }
        },
        {
          headerName: '名称',
          field: 'name',
          suppressMenu: true,
          flex: 1
        },
        {
          headerName: '电压',
          field: 'voltage',
          suppressMenu: true,
          width: 100,
          cellRenderer: params => {
            const found = params.context.componentParent.getVoltages.find(x => x.svg === params.data.voltage);
            return found ? found.name : '';
          }
        }
      ],
      gridOptions: {
        rowSelection: 'single',
        defaultColDef: {
          sortable: true,
          resizable: true,
          filter: true
        },
        animateRows: true,
        context: {
          componentParent: this
        },
        getRowNodeId({ _id }) {
          return _id;
        },
        onRowSelected({ node, data, context }) {
          if (!data || !node.selected) {
            return;
          }
          const _this = context.componentParent;
          _this.selectedSubstation = data;
          _this.getBusListById(data.buses);
        },
        getContextMenuItems({ node, context }) {
          const ret = [];
          if (!node) {
            return ret;
          }
          node.setSelected(true);
          const id = node.data._id;
          if (!id) {
            return ret;
          }
          const _this = context.componentParent;
          ret.push({
            name: '编辑',
            icon: '<i class="el-icon-edit text-success"></i>',
            action() {
              _this.openSubstationEditDialog(id);
            }
          });
          ret.push({
            name: '删除',
            icon: '<i class="el-icon-delete text-error"></i>',
            action() {
              _this.onDeleteSubstation(id);
            }
          });
          return ret;
        }
      },
      segmentRowData: [],
      segmentDefs: [
        {
          headerName: '',
          suppressMenu: true,
          width: 50,
          cellRenderer: params => {
            return params.rowIndex + 1;
          }
        },
        {
          headerName: '起端',
          field: 'startDeviceName',
          width: 100,
          suppressMenu: true
        },
        {
          headerName: '起端类型',
          field: 'startDeviceType',
          suppressMenu: true,
          valueFormatter: params => {
            const _this = params.context.componentParent;
            return _this.formatDeviceType(params.value);
          }
        },
        {
          headerName: '终端',
          field: 'endDeviceName',
          width: 100,
          suppressMenu: true
        },
        {
          headerName: '终端类型',
          field: 'endDeviceType',
          suppressMenu: true,
          valueFormatter: params => {
            const _this = params.context.componentParent;
            return _this.formatDeviceType(params.value);
          }
        },
        {
          headerName: '导线型号',
          field: 'conductorType',
          suppressMenu: true,
          valueFormatter: params => {
            const _this = params.context.componentParent;
            return _this.formatConductorType(params.value);
          }
        },
        {
          headerName: '长度（km）',
          field: 'length',
          suppressMenu: true
        },
        {
          headerName: '截面积（mm）',
          field: 'sectionSurface',
          suppressMenu: true
        }
      ],
      segmentOptions: {
        rowSelection: 'single',
        defaultColDef: {
          resizable: true,
          filter: true,
          width: 100
        },
        animateRows: true,
        context: {
          componentParent: this
        },
        getRowNodeId({ _id }) {
          return _id;
        }
      },
      treeData: [],
      selectedSubstation: '',
      selectedBus: '',
      selectedRow: '',
      editInfo: {
        _id: '',
        name: '',
        description: '',
        segments: []
      },
      graphData: {
        nodeDataArray: [],
        linkDataArray: []
      },
      deviceList: [],
      svg: '',
      xmlStructure: {}
    };
  },
  computed: {
    ...mapGetters([
      'getUserRoutes',
      'getClientHeight',
      'getVoltages',
      'getConductorTypes'
    ]),
    contentHeight() {
      return this.getClientHeight - 5;
    },
    currentRouteText() {
      function findRoute(routes, name) {
        if (!routes) {
          return null;
        }
        for (const route of routes) {
          if (route.name === name) {
            return route;
          } else if (route.children) {
            const found = findRoute(route.children, name);
            if (found) {
              return found;
            }
          }
        }
      }
      const route = findRoute(this.getUserRoutes, this.$route.name);
      return route ? route.label : '配网参数';
    },
    voltages() {
      return this.getVoltages;
    },
    conductorTypes() {
      return this.getConductorTypes;
    },
    buttonDisable() {
      return !this.editInfo.name;
    },
    device() {
      return Globals.device;
    },
    endDeviceRadioOptions() {
      const { tower, breaker, load, tpoint, transformer } = Globals.device;
      return [tower, breaker, load, tpoint, transformer];
    },
    insertRadioOptions() {
      const { tower, breaker } = Globals.device;
      return [tower, breaker];
    }
  },
  mounted() {
    this.getSubstationList();
  },
  methods: {
    onGridReady({ api }) {
      this.gridApi = api;
    },
    // 厂站-获取数据
    async getSubstationList() {
      const { data } = await this.$axios.get('/models/substation/list');
      if (!data.succ) {
        this.$message.error('获取厂站失败');
      }
      this.gridRowData = data.result;
      // 高亮选中厂站
      if (!this.selectedSubstation) {
        return;
      }
      this.$nextTick(() => {
        const rowNode = this.gridApi.getRowNode(this.selectedSubstation._id);
        rowNode && rowNode.setSelected(true);
      });
    },
    // 厂站-新增弹框
    openSubstationCreateDialog() {
      this.substationDialog.id = '';
      this.substationDialog.title = '新增厂站';
      this.substationDialog.visible = true;
      this.$nextTick(() => {
        this.$refs.substationForm.resetFields();
      });
    },
    // 厂站-编辑弹框
    openSubstationEditDialog(id) {
      this.substationDialog.title = '编辑厂站';
      this.substationDialog.id = id;
      this.substationDialog.visible = true;
      this.$nextTick(() => {
        const { name, voltage, subType, state, description, maintainTime } = this.gridRowData.find(x => x._id === id);
        Object.assign(this.substationForm, {
          name, voltage, subType, state, description, maintainTime
        });
        this.$refs.substationForm.validate();
      });
    },
    // 厂站-弹框确认
    onConfirmSubstation() {
      this.$refs.substationForm.validate(async (valid) => {
        if (valid) {
          if (this.substationDialog.id) {
            // 更新
            const { data } = await this.$axios.post('/models/substation/update/' + this.substationDialog.id, this.substationForm);
            if (!data.succ || data.result.modifiedCount !== 1) {
              this.$message.error('操作异常');
              return false;
            }
          } else {
            // 新增
            const { data } = await this.$axios.post('/models/substation/create', this.substationForm);
            if (!data.succ) {
              this.$message.error('操作异常');
              return false;
            }
          }
          this.substationDialog.visible = false;
          await this.getSubstationList();
        } else {
          return false;
        }
      });
    },
    // 厂站-删除
    onDeleteSubstation(id) {
      const found = this.gridRowData.find(x => x._id === id);
      this.$confirm('此操作将永久删除厂站“' + found.name + '”，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const { data } = await this.$axios.delete('/models/substation/delete/' + id);
        if (!data.succ || data.result.deletedCount === 0) {
          this.$message.error('操作异常');
          return;
        }
        // 清空所有数据
        this.selectedSubstation = '';
        this.selectedRow = '';
        this.selectedBus = '';
        this.treeData = [];
        this.editInfo = '';
        this.segmentRowData = [];
        // 获取厂站数据
        await this.getSubstationList();
      }).catch(() => { });
    },
    // 母线-获取数据
    async getBusListById(buses) {
      const { data: busList } = await this.$axios.post('/models/bus/list', buses);
      if (!busList.succ) {
        this.$message.error('获取母线失败');
        return;
      }
      const lineError = [];
      for (const bus of busList.result) {
        const { data: lines } = await this.$axios.post('/models/line/list', bus.lines);
        if (!lines.succ) {
          lineError.push(`获取${bus.name}的线路失败`);
          continue;
        }
        bus.children = lines.result;
      }
      if (lineError.length > 0) {
        this.$message.error('获取部分线路失败');
        console.log(lineError);
      }
      const selectedKey = JSON.parse(JSON.stringify(this.$refs.tree.getCurrentKey()));
      this.treeData = busList.result;
      // 高亮选中节点
      if (!selectedKey) {
        return;
      }
      this.$nextTick(() => {
        this.$refs.tree.setCurrentKey(selectedKey);
      });
    },
    // 母线-新增弹框
    openBusCreateDialog() {
      this.busDialog.id = '';
      this.busDialog.title = '新增母线';
      this.busDialog.visible = true;
      this.$nextTick(() => {
        this.$refs.busForm.resetFields();
      });
    },
    // 母线-编辑弹框
    openBusEditDialog({ _id, name, voltage, description }) {
      this.busDialog.title = '编辑母线';
      this.busDialog.id = _id;
      this.busDialog.visible = true;
      this.$nextTick(() => {
        Object.assign(this.busForm, {
          name, voltage, description
        });
        this.$refs.busForm.validate();
      });
    },
    // 母线-弹框确认
    onConfirmBus() {
      this.$refs.busForm.validate(async (valid) => {
        if (valid) {
          const { _id, buses = [] } = this.selectedSubstation;
          if (this.busDialog.id) {
            // 更新
            delete this.busForm._id;
            const { data } = await this.$axios.post('/models/bus/update/' + this.busDialog.id, this.busForm);
            if (!data.succ || data.result.modifiedCount !== 1) {
              this.$message.error('操作异常');
              return false;
            }
          } else {
            // 新增母线
            this.busForm.substation = _id;
            const { data: bus } = await this.$axios.post('/models/bus/create', this.busForm);
            if (!bus.succ) {
              this.$message.error('新增母线异常');
              return false;
            }
            // 把新增母线id放入关联数组中
            buses.push(bus.result._id);
            // 更新厂站的关联
            const { data: substation } = await this.$axios.post('/models/substation/update/' + _id, { buses });
            if (!substation.succ) {
              this.$message.error('更新厂站异常');
              return false;
            }
          }
          this.busDialog.visible = false;
          await this.getBusListById(buses);
        } else {
          return false;
        }
      });
    },
    // 母线-删除
    onDeleteBus({ _id, name, lines = [] }) {
      this.$confirm('此操作将永久删除线路“' + name + '”，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const { data } = await this.$axios.delete('/models/bus/delete/' + _id);
        if (!data.succ || data.result.deletedCount === 0) {
          this.$message.error('操作异常');
          return;
        }
        // 如果删除厂站包含了当前选中的线路，清空数据
        if (lines.includes(line => line === this.editInfo._id)) {
          this.segmentRowData = [];
          this.editInfo = '';
          this.selectedRow = '';
          this.selectedBus = '';
        }
        // 刷新母线列表
        await this.getBusListById(this.selectedSubstation.buses);
        // 右侧图形是删除的线路图时，清空图形
        if (this.editInfo.bus === _id) {
          this.editInfo = this.$options.data().editInfo;
          this.$refs.graph.removeSvg();
          this.svg = '';
        }
      }).catch(() => { });
    },
    // 线路-新增弹框
    openLineCreateDialog(data) {
      this.lineDialog.id = '';
      this.lineDialog.title = '新增线路';
      this.lineDialog.visible = true;
      this.selectedBus = data;
      this.$nextTick(() => {
        this.$refs.lineForm.resetFields();
      });
    },
    // 线路-编辑弹框
    openLineEditDialog(data) {
      this.lineDialog.title = '编辑线路';
      this.lineDialog.id = data._id;
      this.lineDialog.visible = true;
      this.$nextTick(() => {
        this.lineForm = JSON.parse(JSON.stringify(data));
        this.$nextTick(() => {
          this.$refs.lineForm.validate();
        });
      });
    },
    // 线路-弹框确认
    onConfirmLine() {
      this.$refs.lineForm.validate(async (valid) => {
        if (valid) {
          if (this.lineDialog.id) {
            // 更新
            const { data } = await this.$axios.post('/models/line/update/' + this.lineDialog.id, this.lineForm);
            if (!data.succ || data.result.modifiedCount !== 1) {
              this.$message.error('操作异常');
              return false;
            }
            if (this.editInfo._id === this.lineDialog.id) {
              await this.loadEditInfo({ _id: this.lineDialog.id, ...this.lineForm });
            }
          } else {
            // 新增线路
            const { _id, lines = [] } = this.selectedBus;
            this.lineForm.bus = _id;
            const { data: line } = await this.$axios.post('/models/line/create', this.lineForm);
            if (!line.succ) {
              this.$message.error('新增线路异常');
              return false;
            }
            // 把新增线路id放入关联数组中
            lines.push(line.result._id);
            // 更新母线的关联
            const { data: bus } = await this.$axios.post('/models/bus/update/' + _id, { lines });
            if (!bus.succ) {
              this.$message.error('更新母线异常');
              return false;
            }
          }
          this.lineDialog.visible = false;
          await this.getBusListById(this.selectedSubstation.buses);
        } else {
          return false;
        }
      });
    },
    // 线路-删除
    onDeleteLine({ _id, name, svg }) {
      this.$confirm('此操作将永久删除线路“' + name + '”，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const { data } = await this.$axios.delete(`/models/line/delete/${_id}/${svg}`);
        if (!data.succ || data.result.deletedCount === 0) {
          this.$message.error('操作异常');
          return;
        }
        await this.getBusListById(this.selectedSubstation.buses);
        // 右侧图形是删除的线路图时，清空图形
        if (this.editInfo._id === _id) {
          this.editInfo = this.$options.data().editInfo;
          this.$refs.graph.removeSvg();
          this.svg = '';
        }
      }).catch(() => { });
    },
    // 点击树组件node节点
    async onClickTreeNode(data, { level, parent }) {
      // 只触发线路
      if (level !== 2) {
        return;
      }
      // 当前相同线路不重复触发
      if (this.editInfo._id === data._id) {
        return;
      }
      // 选中处理
      this.selectedBus = parent.data;
      this.selectedRow = '';
      // 加载右侧编辑信息
      await this.loadEditInfo(data);
    },
    // 加载右侧编辑信息
    async loadEditInfo(data) {
      this.editInfo = data;
      await this.getSegmentList(data.segments);
    },
    // 线路段-新增弹框
    openLineSegmentDialog() {
      // 初始起始段选项数据
      if (this.segmentRowData.length === 0) {
        this.startDeviceList.push({ ...this.selectedBus, type: 'bus' });
      }
      // 初始弹框信息
      this.lineSegmentDialog.id = '';
      this.lineSegmentDialog.title = '新增线路段';
      this.lineSegmentDialog.visible = true;
      this.$nextTick(() => {
        this.$refs.lineSegmentForm.resetFields();
      });
    },
    // 线路段-新增弹框-确认
    onConfirmSegment() {
      this.$refs.lineSegmentForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }
        // 新增终端设备
        const type = this.lineSegmentForm.segment.endDeviceType;
        const { data: endDevice } = await this.$axios.post(`/models/${type}/create`, this.lineSegmentForm[type]);
        if (!endDevice.succ) {
          this.$message.error('新增终止端异常');
          return false;
        }
        // 新增线路段
        const segmentForm = this.lineSegmentForm.segment;
        const found = this.startDeviceList.find(x => x._id === segmentForm.startDeviceId);
        segmentForm.startDeviceType = found.type;
        segmentForm.endDeviceId = endDevice.result._id;
        // index的判定待写
        segmentForm.index = found.type === 'bus' ? 1 : 0;
        const { data: segment } = await this.$axios.post('/models/segment/create', segmentForm);
        if (!segment.succ) {
          this.$message.error('新增线路段异常');
          return false;
        }
        // 更新线路关联
        const segments = JSON.parse(JSON.stringify(this.editInfo.segments));
        const update = await this.updateLine([...segments, segment.result._id]);
        if (update) {
          this.lineSegmentDialog.visible = false;
        }
      });
    },
    // 线路段-获取数据
    async getSegmentList(segments) {
      // 获取线路段
      const { data } = await this.$axios.post('/models/segment/list', segments);
      if (!data.succ) {
        this.$message.error('获取线路段异常');
        return;
      }
      const deviceObj = {
        bus: [],
        tower: [],
        breaker: [],
        load: [],
        tpoint: [],
        transformer: []
      };
      const segmentList = data.result;
      // 整理线路段中的设备
      for (const segment of segmentList) {
        const { startDeviceId, startDeviceType, endDeviceId, endDeviceType } = segment;
        deviceObj[startDeviceType] && deviceObj[startDeviceType].push(startDeviceId);
        deviceObj[endDeviceType] && deviceObj[endDeviceType].push(endDeviceId);
      }
      const deviceList = [];
      this.startDeviceList = [];
      // 通过id查找所有的设备
      for (const deviceType in deviceObj) {
        if (deviceObj[deviceType].length === 0) {
          continue;
        }
        const { data: startDevice } = await this.$axios.post(`/models/${deviceType}/list`, deviceObj[deviceType]);
        if (!startDevice.succ) {
          continue;
        }
        // 结果放入设备集合
        deviceList.push(...startDevice.result);
        // 排除母线、负荷
        if (deviceType === 'bus' || deviceType === 'load') {
          continue;
        }
        // 设备连接上限
        const { maxLinks } = Globals.device[deviceType];
        for (const unit of startDevice.result) {
          // 如果设备的连接数达到上限，不放入起始端
          const filter = segmentList.filter(x => x.startDeviceId === unit._id || x.endDeviceId === unit._id);
          if (maxLinks && filter.length >= maxLinks) {
            continue;
          }
          // 增加类型属性
          unit.type = deviceType;
          this.startDeviceList.push(unit);
        }
      }
      // 查找设备名称
      for (const segment of data.result) {
        const { startDeviceId, endDeviceId } = segment;
        segment.startDeviceName = deviceList.find(x => x._id === startDeviceId)?.name || '';
        segment.endDeviceName = deviceList.find(x => x._id === endDeviceId)?.name || '';
      }
      // 表格数据
      this.segmentRowData = segmentList;
      // 所有设备数据
      this.deviceList = deviceList;
      // 显示选中行
      if (this.selectedRow) {
        const found = this.segmentRowData.find(x => x._id === this.selectedRow._id);
        // found && this.$refs.multipleTable.setCurrentRow(found);
      }
      if (this.editInfo.svg) {
        // 生成svg图片
        const { data } = await this.$axios.get(`/models/svg/${this.editInfo.svg}`);
        if (data instanceof Object) {
          this.$message.error('获取svg失败');
          return;
        }
        this.svg = data;
        this.$nextTick(() => {
          this.$refs.graph.initSvg();
        });
      } else {
        // 根据线路段生成图形
        this.graphData = {
          nodeDataArray: [],
          linkDataArray: []
        };
        // 清除原本的svg图片
        this.svg = '';
        const found = this.segmentRowData.find(x => x.startDeviceType === Globals.device.bus.label);
        found && this.traverse(found.startDeviceId, true);
        // 刷新图形
        this.$nextTick(() => {
          this.$refs.graph.load();
        });
      }
    },
    // 遍历
    traverse(startDeviceId, isFirst) {
      const filters = this.segmentRowData.filter(x => x.startDeviceId === startDeviceId);
      if (filters.length === 0) {
        return;
      }
      filters.forEach((segment, index) => {
        this.generalGraph(segment, isFirst);
        this.traverse(segment.endDeviceId, false);
      });
    },
    // 生成图形数据
    generalGraph({
      startDeviceId,
      startDeviceType,
      startDeviceName,
      endDeviceId,
      endDeviceType,
      endDeviceName,
      conductorType
    }, isFirst) {
      const start = this.getDeviceModel(startDeviceId, startDeviceType);
      const end = this.getDeviceModel(endDeviceId, endDeviceType);
      // 起端设备
      isFirst && this.graphData.nodeDataArray.push({
        key: startDeviceId,
        category: startDeviceType,
        geometryString: start.svg,
        text: startDeviceName
      });
      // 终端设备
      this.graphData.nodeDataArray.push({
        key: endDeviceId,
        category: endDeviceType,
        geometryString: end.svg,
        text: endDeviceName
      });
      // 连线
      this.graphData.linkDataArray.push({
        from: startDeviceId,
        fromPort: start.maxLinks ? (start.maxLinks === 999 ? 'center' : 'bottom') : '',
        to: endDeviceId,
        toPort: end.maxLinks ? (end.maxLinks === 999 ? 'center' : 'top') : '',
        strokeDashArray: startDeviceType === Globals.device.bus.label ? [4, 2] : '',
        text: this.formatConductorType(conductorType)
      });
    },
    getDeviceModel(id, type) {
      if (type === 'breaker') {
        const found = this.deviceList.find(x => x._id === id);
        if (!found) {
          return Globals.device[type] || {};
        }
        return Globals.device[found.breakerType] || {};
      }
      return Globals.device[type] || {};
    },
    // 线路段-编辑弹框
    openSegmentEditDialog() {
      this.segmentEditDialog.id = JSON.parse(JSON.stringify(this.selectedRow._id));
      this.segmentEditDialog.title = '编辑线路段';
      this.segmentEditDialog.visible = true;
      this.$nextTick(() => {
        const { lineType, conductorType, ground, circuit, length, sectionSurface } = this.selectedRow;
        Object.assign(this.segmentForm, {
          lineType, conductorType, ground, circuit, length, sectionSurface
        });
        this.$nextTick(() => {
          this.$refs.segmentForm.validate();
        });
      });
    },
    // 线路段-编辑弹框-确认
    onSegmentEdit() {
      this.$refs.segmentForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }
        delete this.segmentForm._id;
        const { data } = await this.$axios.post('/models/segment/update/' + this.segmentEditDialog.id, this.segmentForm);
        if (!data.succ || data.result.modifiedCount !== 1) {
          this.$message.error('操作异常');
          return false;
        }
        this.segmentEditDialog.visible = false;
        await this.getSegmentList(this.editInfo.segments);
      });
    },
    // 线路段-删除
    onDeleteSegment() {
      if (this.segmentRowData.some(x => x.startDeviceId === this.selectedRow.endDeviceId)) {
        this.$message.warning('当前终端存在其他连接关系，无法删除');
        return;
      }
      this.$confirm('此操作将永久删除当前线路段' + '，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        // 删除线路段
        const { data } = await this.$axios.delete('/models/segment/delete/' + this.selectedRow._id);
        if (!data.succ || data.result.deletedCount === 0) {
          this.$message.error('删除线路段异常');
          return;
        }
        // 更新线路
        const segments = JSON.parse(JSON.stringify(this.editInfo.segments));
        segments.splice(segments.indexOf(this.selectedRow._id), 1);
        const update = await this.updateLine(segments);
        update && (this.selectedRow = '');
      }).catch(() => { });
    },
    // 线路段-插入弹框
    openInsertDialog() {
      this.segmentInsertDialog.id = '';
      this.segmentInsertDialog.title = '插入线路段';
      this.segmentInsertDialog.visible = true;
      this.$nextTick(() => {
        this.$refs.segmentInsertForm.resetFields();
      });
    },
    // 线路段-插入弹框-确认
    onConfirmInsert() {
      this.$refs.segmentInsertForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }
        const segmentForm = this.segmentInsertForm.segment;
        // 新增插入设备
        const type = segmentForm.endDeviceType;
        const { data: insert } = await this.$axios.post(`/models/${type}/create`, this.segmentInsertForm[type]);
        if (!insert.succ) {
          this.$message.error('新增插入设备异常');
          return false;
        }
        // 插入线路段
        const { _id, startDeviceId, startDeviceType } = this.selectedRow;
        Object.assign(segmentForm, {
          startDeviceId,
          startDeviceType,
          endDeviceId: insert.result._id,
          index: 1
        });
        const { data: segment } = await this.$axios.post('/models/segment/create', segmentForm);
        if (!segment.succ) {
          this.$message.error('新增线路段异常');
          return false;
        }
        // 更新旧线路
        const { data: update } = await this.$axios.post('/models/segment/update/' + _id, {
          startDeviceId: insert.result._id,
          startDeviceType: type
        });
        if (!update.succ || update.result.modifiedCount !== 1) {
          this.$message.error('更新线路段异常');
          return false;
        }
        // 更新线路关联
        const segments = JSON.parse(JSON.stringify(this.editInfo.segments));
        segments.splice(segments.indexOf(_id), 0, segment.result._id);
        const updateLine = await this.updateLine(segments);
        updateLine && (this.segmentInsertDialog.visible = false);
      });
    },
    // api-更新线路的线路段
    async updateLine(segments) {
      const { data } = await this.$axios.post('/models/line/update/' + this.editInfo._id, { segments });
      if (!data.succ) {
        this.$message.error('更新线路异常');
        return false;
      }
      this.editInfo.segments = segments;
      await this.getSegmentList(segments);
      return true;
    },
    // 线路-清空验证
    onRadioChange() {
      this.$refs.lineSegmentForm.clearValidate();
    },
    // 线路段-编辑弹框-清空验证
    onEditRadioChange() {
      this.$refs.segmentForm.clearValidate();
    },
    // 线路段-插入弹框-清空验证
    onInsertRadioChange() {
      this.$refs.segmentInsertForm.clearValidate();
    },
    // 点击表格某一行时触发
    onTableClick(row) {
      this.selectedRow = row;
      this.$refs.graph.setLineSelected(row.startDeviceId, row.endDeviceId);
    },
    // 选中线路
    onSelectLink({ from, to }) {
      const row = this.segmentRowData.find(x => x.startDeviceId === from && x.endDeviceId === to);
      this.selectedRow = row || '';
      // this.$refs.multipleTable.setCurrentRow(row);
    },
    // 选中svg
    async onSelectSvg({ id, type }) {
      switch (type) {
        case 'breaker': {
          const { data } = await this.$axios.get(`/models/breaker/${this.editInfo.svg}/${id}`);
          if (!data.succ) {
            this.$message.error('查询异常');
            break;
          }
          if (!data.result) {
            this.$message.warning('模型缺失');
            break;
          }
          this.breaker.dialog.id = data.result._id;
          this.breaker.dialog.title = '属性';
          this.breaker.dialog.visible = true;
          this.$nextTick(() => {
            this.$refs.breakerForm.resetFields();
            Object.assign(this.breaker.form, data.result);
          });
          break;
        }
        case 'bus': {
          const { data } = await this.$axios.get(`/models/bus/${id}`);
          if (!data.succ) {
            this.$message.error('查询异常');
            break;
          }
          if (!data.result) {
            this.$message.warning('模型缺失');
            break;
          }
          this.busDialog.id = data.result._id;
          this.busDialog.title = '属性';
          this.busDialog.visible = true;
          this.$nextTick(() => {
            this.$refs.busForm.resetFields();
            Object.assign(this.busForm, data.result);
          });
          break;
        }
        case 'transformer': {
          const { data } = await this.$axios.get(`/models/transformer/${id}`);
          if (!data.succ) {
            this.$message.error('查询异常');
            break;
          }
          if (!data.result) {
            this.$message.warning('模型缺失');
            break;
          }
          this.transformer.dialog.id = data.result._id;
          this.transformer.dialog.title = '属性';
          this.transformer.dialog.visible = true;
          this.$nextTick(() => {
            this.$refs.transformerForm.resetFields();
            Object.assign(this.transformer.form, data.result);
          });
          break;
        }
        case 'segment': {
          const { data } = await this.$axios.get(`/models/segment/${id}`);
          if (!data.succ) {
            this.$message.error('查询异常');
            break;
          }
          if (!data.result) {
            this.$message.warning('模型缺失');
            break;
          }
          this.segment.dialog.id = data.result._id;
          this.segment.dialog.title = '属性';
          this.segment.dialog.visible = true;
          this.$nextTick(() => {
            this.$refs.acSegmentForm.resetFields();
            Object.assign(this.segment.form, data.result);
          });
          break;
        }
      }
    },
    // 开关-确认弹框
    onConfirmBreaker() {
      this.$refs.breakerForm.validate(async (valid) => {
        if (!valid) {
          return;
        }
        delete this.breaker.form._id;
        const { data } = await this.$axios.post('/models/breaker/update/' + this.breaker.dialog.id, this.breaker.form);
        if (!data.succ || data.result.modifiedCount !== 1) {
          this.$message.error('操作异常');
          return false;
        }
        this.breaker.dialog.visible = false;
      });
    },
    // 变压器-确认弹框
    onConfirmTransformer() {
      this.$refs.transformerForm.validate(async (valid) => {
        if (!valid) {
          return;
        }
        delete this.transformer.form._id;
        const { data } = await this.$axios.post('/models/transformer/update/' + this.transformer.dialog.id, this.transformer.form);
        if (!data.succ || data.result.modifiedCount !== 1) {
          this.$message.error('操作异常');
          return false;
        }
        this.transformer.dialog.visible = false;
      });
    },
    // 线路段-确认弹框
    onConfirmAcSegment() {
      this.$refs.acSegmentForm.validate(async (valid) => {
        if (!valid) {
          return;
        }
        delete this.segment.form._id;
        const { data } = await this.$axios.post('/models/segment/update/' + this.segment.dialog.id, this.segment.form);
        if (!data.succ || data.result.modifiedCount !== 1) {
          this.$message.error('操作异常');
          return false;
        }
        this.segment.dialog.visible = false;
      });
    },
    formatDeviceType(deviceType) {
      const { tower, bus, breaker, load, transformer, tpoint } = this.device;
      const type = [tower, bus, breaker, load, transformer, tpoint];
      const found = type.find(x => x.label === deviceType);
      return found ? found.name : '未知';
    },
    formatConductorType(id) {
      const found = this.conductorTypes.find(x => x._id === id);
      return found ? found.name : '未知';
    },
    // 定值计算
    async onCalculate(id) {
      await this.callJsScript('整定计算', {
        xmlId: this.editInfo.svg,
        breakerSId: id
      });
      this.$message.info('计算完成');
    },
    // 生成定值单
    async onGeneralCalculate(id) {
      const { data } = await this.$axios.get(`/models/calculate/${id}`);
      if (!data.succ) {
        this.$message.error('生成异常');
      }
      if (!data.result) {
        this.$message.info('不存在计算结果，请完成整定计算');
        return;
      }
      await this.callJsScript('定值单', {
        xmlId: this.editInfo.svg,
        breakerSId: id
      });
      this.$message.info('生成完成');
    },
    // 调用脚本
    async callJsScript(identifier, param) {
      const { data: jsFiles } = await this.$axios.get('/manage/js-files');
      const js = jsFiles.find(x => x.metadata.identifier === identifier);
      if (!js) {
        this.$message.error('未找到脚本文件');
        return;
      }
      await this.$refs.script.run({
        scriptId: js._id,
        param
      });
    }
  }
};
</script>

<style scoped>
.button-group {
  display: flex;
  margin: 10px 0;
}

.group-button {
  margin-left: 5px;
}

.edit-remark {
  font-size: 8px;
  color: #7f828b;
  font-style: italic;
  font-weight: bold
}

.padding-left-5 {
  padding-left: 5px;
}

.padding-left-10 {
  padding-left: 10px;
}

.padding-top-5 {
  padding-top: 5px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.color-red {
  color: red;
}

.substation-buttons {
  display: flex;
  justify-content: space-between;
  padding: 5px 5px;
}

.margin-top-5 {
  margin-top: 5px;
}

.radio-group {
  display: flex;
}

.radio-height {
  height: 28px;
  line-height: 28px;
}

:deep(.el-form-item__label) {
  white-space: pre-line;
  margin-right: -30px;
}
</style>
