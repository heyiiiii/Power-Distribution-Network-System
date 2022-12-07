<template>
  <table class="param-table fill-width full-width">
    <tbody>
      <template v-if="inputs.header && inputs.header.length > 0">
        <tr>
          <template v-for="(item, index) of inputs.header">
            <th :key="index">
              <span>{{ item }}</span>
            </th>
          </template>
        </tr>
      </template>
      <template v-for="(op, opIndex) of inputs.options" >
        <tr :key="opIndex">
          <th>
            <template v-if="op.html">
              <div v-html="op.html" />
            </template>
            <template v-else>
              <span >{{ op.label }}</span>
            </template>
          </th>
          <!-- 单个 -->
          <template v-if="!Array.isArray(op.value)">
            <td class="p-5">
              <el-input v-model="op.value" :placeholder="op.placeholder" :disabled="op.disabled" @input="onInput(op)" />
              <span class="description-font" v-html="op.description" />
            </td>
          </template>
          <!-- 多个 -->
          <template v-else>
            <template v-for="(v, vIndex) in op.value">
              <td :key="vIndex" class="p-5">
                <el-input v-model="v.value" :placeholder="v.placeholder" :disabled="v.disabled" @input="onInput(v)" />
                <span class="description-font" v-html="v.description" />
              </td>
            </template>
          </template>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script>
export default {
  name: 't-script-input',
  props: {
    inputs: {
      type: Object,
      default: {
        header: [],
        options: []
      }
    }
  },
  data() {
    return {};
  },
  methods: {
    onInput(data) {
      data.value = data.regex ? data.value.replace(new RegExp(data.regex), '') : data.value;
    }
  }
};
</script>

<style scoped>
.p-5 {
  padding: 5px;
}
</style>
