<template>
  <div class="checkin-page">
    <div class="checkin-container">
      <a-card class="status-card" :bordered="false">
        <div class="user-section">
          <a-avatar :size="56">
            <img v-if="userStore.avatar" :src="userStore.avatar" />
            <IconUser v-else :size="28" />
          </a-avatar>
          <div class="user-info">
            <span class="username">{{ userStore.username || '用户' }}</span>
            <div class="level-info">
              <a-tag color="arcoblue">Lv.{{ checkinStats.level }}</a-tag>
              <span class="exp-text">{{ checkinStats.exp }} EXP</span>
            </div>
          </div>
        </div>

        <div class="exp-section">
          <a-progress :percent="expPercent" :stroke-width="8" size="large" />
          <span class="exp-tip">距离下一级还需 {{ checkinStats.expToNextLevel }} 经验</span>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-num">{{ checkinStats.continuousDays }}</span>
            <span class="stat-label">连续签到</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ checkinStats.points }}</span>
            <span class="stat-label">积分</span>
          </div>
        </div>

        <a-button
          type="primary"
          long
          size="large"
          :loading="checkingIn"
          :disabled="checkedIn"
          @click="handleCheckin"
        >
          <IconCheckCircle />
          {{ checkedIn ? '今日已签到' : '立即签到' }}
        </a-button>

        <div class="card-section">
          <div class="section-title">
            <IconGift />
            <span>补签卡</span>
          </div>
          <div class="card-info">
            <span class="card-count">{{ checkinStats.signCards }} 张</span>
            <a-button
              size="small"
              type="outline"
              :disabled="checkinStats.points < 50"
              :loading="exchanging"
              @click="handleExchangeCard"
            >
              50积分兑换
            </a-button>
          </div>
        </div>
      </a-card>

      <a-card class="calendar-card" :bordered="false">
        <template #title>
          <div class="calendar-header">
            <a-button size="mini" @click="prevMonth">
              <IconLeft />
            </a-button>
            <span class="calendar-title">{{ currentYear }}年{{ currentMonth }}月</span>
            <a-button size="mini" @click="nextMonth">
              <IconRight />
            </a-button>
          </div>
        </template>
        <div class="calendar-body">
          <div class="calendar-weekdays">
            <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
          </div>
          <div class="calendar-days">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              class="calendar-day"
              :class="{
                'other-month': day.otherMonth,
                today: day.isToday,
                signed: day.signed,
                'can-repair': day.canRepair,
              }"
              @click="handleDayClick(day)"
            >
              <span>{{ day.day }}</span>
              <span v-if="day.signed" class="day-mark signed">✓</span>
              <span v-else-if="day.canRepair" class="day-mark repair">↻</span>
            </div>
          </div>
        </div>
        <div class="calendar-legend">
          <span class="legend-item"><span class="dot signed"></span>已签到</span>
          <span class="legend-item"><span class="dot repair"></span>可补签</span>
        </div>
      </a-card>

      <a-card class="records-card" :bordered="false">
        <template #title>签到记录</template>
        <a-spin :loading="recordsLoading" class="records-spin">
          <div v-if="signRecords.length > 0" class="records-list">
            <div
              v-for="record in signRecords"
              :key="record.id || record.signDate"
              class="record-item"
            >
              <span class="record-date">{{ record.signDate }}</span>
              <a-tag :color="!record.isRepair ? 'green' : 'orange'" size="small">
                {{ !record.isRepair ? '签到' : '补签' }}
              </a-tag>
              <span class="record-reward"
                >+{{ record.expGained }}经验 +{{ record.pointsGained }}积分</span
              >
            </div>
          </div>
          <a-empty v-else description="暂无记录" />
        </a-spin>
        <div v-if="pagination.total > 0" class="records-pagination">
          <a-pagination
            :current="pagination.current"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            size="small"
            simple
            @change="handlePageChange"
          />
        </div>
      </a-card>
    </div>

    <a-modal
      v-model:visible="repairModalVisible"
      title="补签确认"
      @ok="handleRepairConfirm"
      @cancel="repairModalVisible = false"
    >
      <p>确定要使用一张补签卡补签 {{ selectedDate }} 吗？</p>
    </a-modal>
  </div>
</template>

<script setup>
import {
  IconUser,
  IconCheckCircle,
  IconCheckCircleFill,
  IconGift,
  IconHistory,
  IconLeft,
  IconRight,
  IconSync,
} from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/stores/user'
import { usePageRefresh } from '@/composables/usePageRefresh'
import log from '@/utils/logger'
import {
  signDaily,
  getSignStatus,
  repairSign,
  exchangeSignCard,
  getSignRecords,
  getSignCalendar,
} from '@/apis/checkin'

definePage({
  meta: {
    title: '签到中心',
    requiresAuth: true,
  },
})

const router = useRouter()
const userStore = useUserStore()
const { markForRefresh, checkAndRefresh } = usePageRefresh()

const checkingIn = ref(false)
const exchanging = ref(false)
const recordsLoading = ref(false)
const repairModalVisible = ref(false)
const selectedDate = ref('')

const checkedIn = ref(false)
const checkinStats = ref({
  continuousDays: 0,
  level: 0,
  exp: 0,
  points: 0,
  signCards: 0,
  expToNextLevel: 100,
  maxContinuousDays: 0,
  monthSignDays: 0,
})

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const calendarDays = ref([])
const signRecords = ref([])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const expPercent = computed(() => {
  const exp = checkinStats.value.exp || 0
  const expToNext = checkinStats.value.expToNextLevel || 0

  if (expToNext <= 0) {
    if (exp <= 0) return 0
    const percent = Math.min(0.99, exp / (exp + 100))
    return Math.round(percent * 1000) / 1000
  }

  const total = exp + expToNext
  if (total <= 0) return 0

  const percent = exp / total
  return Math.round(percent * 1000) / 1000
})

const fetchCheckinStatus = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await getSignStatus()
    const data = res?.data || res
    if (data) {
      checkedIn.value = data.todaySigned ?? false

      let expToNext = data.expToNextLevel ?? 100
      if (expToNext <= 0) {
        expToNext = 100
      }

      checkinStats.value = {
        continuousDays: data.continuousDays ?? 0,
        level: data.level ?? 0,
        exp: data.exp ?? 0,
        points: data.points ?? 0,
        signCards: data.signCards ?? 0,
        expToNextLevel: expToNext,
        maxContinuousDays: data.maxContinuousDays ?? 0,
        monthSignDays: data.monthSignDays ?? 0,
      }
    }
  } catch (error) {
    log.error('获取签到状态失败:', error)
    checkedIn.value = false
  }
}

const fetchCalendar = async () => {
  try {
    const res = await getSignCalendar(currentYear.value, currentMonth.value)
    const data = res?.data || res
    generateCalendar(data || [])
  } catch {
    generateCalendar([])
  }
}

const generateCalendar = (signedDates = []) => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = []
  const startPadding = firstDay.getDay()

  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      date: `${year}-${String(month - 1).padStart(2, '0')}-${String(prevMonthLastDay - i).padStart(2, '0')}`,
      otherMonth: true,
      signed: false,
      canRepair: false,
      isToday: false,
    })
  }

  const signedSet = new Set(signedDates.map((d) => d.signDate || d))

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month - 1, i)
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const isToday = date.getTime() === today.getTime()
    const isPast = date < today
    const isSigned = signedSet.has(dateStr)

    days.push({
      day: i,
      date: dateStr,
      otherMonth: false,
      signed: isSigned,
      canRepair: isPast && !isSigned && !isToday,
      isToday,
    })
  }

  const endPadding = 42 - days.length
  for (let i = 1; i <= endPadding; i++) {
    days.push({
      day: i,
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      otherMonth: true,
      signed: false,
      canRepair: false,
      isToday: false,
    })
  }

  calendarDays.value = days
}

const fetchRecords = async () => {
  recordsLoading.value = true
  try {
    const res = await getSignRecords({
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    })
    const data = res?.data || res
    if (data) {
      signRecords.value = data.records || []
      pagination.total = data.totalRow || 0
      pagination.current = data.pageNumber || pagination.current
    }
  } catch {
    signRecords.value = []
  } finally {
    recordsLoading.value = false
  }
}

const handleCheckin = async () => {
  if (checkedIn.value || checkingIn.value) return
  checkingIn.value = true
  try {
    const res = await signDaily()
    const data = res?.data || res
    if (data?.success) {
      checkedIn.value = true

      const newExp = data.currentExp ?? data.exp ?? checkinStats.value.exp
      let newExpToNext = data.expToNextLevel

      if (newExpToNext === undefined || newExpToNext === null || newExpToNext <= 0) {
        newExpToNext = checkinStats.value.expToNextLevel
      }

      if (newExpToNext <= 0) {
        newExpToNext = 100
      }

      checkinStats.value = {
        ...checkinStats.value,
        continuousDays: data.continuousDays ?? checkinStats.value.continuousDays,
        level: data.currentLevel ?? data.level ?? checkinStats.value.level,
        exp: newExp,
        points: data.currentPoints ?? data.points ?? checkinStats.value.points,
        signCards: data.signCards ?? checkinStats.value.signCards,
        expToNextLevel: newExpToNext,
        maxContinuousDays: data.maxContinuousDays ?? checkinStats.value.maxContinuousDays,
        monthSignDays: data.monthSignDays ?? checkinStats.value.monthSignDays,
      }

      const expGained = data.expGained ?? 0
      const pointsGained = data.pointsGained ?? 0
      Message.success(`${data.message || '签到成功'}！+${expGained} 经验 +${pointsGained} 积分`)

      if (data.levelUp) {
        Message.success(`恭喜升级！当前等级 Lv.${data.newLevel ?? checkinStats.value.level}`)
      }

      markForRefresh('/')
      await fetchCalendar()
    } else {
      Message.error(data?.message || '签到失败，请稍后再试')
    }
  } catch {
    Message.error('签到失败，请稍后再试')
  } finally {
    checkingIn.value = false
  }
}

const handleExchangeCard = async () => {
  if (checkinStats.value.points < 50) {
    Message.warning('积分不足，需要50积分')
    return
  }
  exchanging.value = true
  try {
    const res = await exchangeSignCard()
    const data = res?.data || res
    if (data?.success) {
      checkinStats.value.signCards = data.signCards ?? checkinStats.value.signCards + 1
      checkinStats.value.points = data.remainingPoints ?? checkinStats.value.points - 50
      markForRefresh('/')
      Message.success('兑换成功！获得一张补签卡')
    } else {
      Message.error(data?.message || '兑换失败')
    }
  } catch {
    Message.error('兑换失败，请稍后再试')
  } finally {
    exchanging.value = false
  }
}

const handleDayClick = (day) => {
  if (day.canRepair) {
    selectedDate.value = day.date
    repairModalVisible.value = true
  }
}

const handleRepairConfirm = async () => {
  if (!selectedDate.value) return
  if (checkinStats.value.signCards <= 0) {
    Message.warning('补签卡不足，请先兑换')
    repairModalVisible.value = false
    return
  }

  try {
    log.debug('补签请求日期:', selectedDate.value)
    const res = await repairSign(selectedDate.value)
    log.debug('补签响应:', res)
    const data = res?.data || res
    if (data?.success) {
      checkinStats.value.signCards = data.remainingCards ?? checkinStats.value.signCards - 1

      const expGained = data.expGained ?? 0
      const pointsGained = data.pointsGained ?? 0
      Message.success(`${data.message || '补签成功'}！+${expGained} 经验 +${pointsGained} 积分`)

      markForRefresh('/')
      await fetchCheckinStatus()
      await fetchCalendar()
      await fetchRecords()
    } else {
      Message.error(data?.message || '补签失败')
    }
  } catch (error) {
    log.error('补签失败:', error)
    const errorMsg = error?.response?.data?.message || error?.message || '补签失败，请稍后再试'
    Message.error(errorMsg)
  } finally {
    repairModalVisible.value = false
    selectedDate.value = ''
  }
}

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  fetchCalendar()
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  fetchCalendar()
}

const handlePageChange = (page) => {
  pagination.current = page
  fetchRecords()
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }
  fetchCheckinStatus()
  fetchCalendar()
  fetchRecords()
})

const refreshAllData = async () => {
  await Promise.all([fetchCheckinStatus(), fetchCalendar(), fetchRecords()])
}

onActivated(() => {
  checkAndRefresh(refreshAllData)
})
</script>

<style lang="scss" scoped>
.checkin-page {
  height: calc(100vh - 64px - 88px);
  padding: 16px;
  overflow: hidden;
  box-sizing: border-box;
}

.checkin-container {
  max-width: 1300px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  gap: 16px;
}

.status-card {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-self: flex-start;

  :deep(.arco-card-body) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border-2);
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .username {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-1);
    }

    .level-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .exp-text {
        font-size: 12px;
        color: var(--color-text-3);
      }
    }
  }

  .exp-section {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .exp-tip {
      font-size: 12px;
      color: var(--color-text-3);
      text-align: center;
    }
  }

  .stats-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    background-color: var(--color-fill-1);
    border-radius: 8px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex: 1;

    .stat-num {
      font-size: 20px;
      font-weight: 700;
      color: rgb(var(--primary-6));
    }

    .stat-label {
      font-size: 11px;
      color: var(--color-text-3);
    }
  }

  .stat-divider {
    width: 1px;
    height: 32px;
    background-color: var(--color-border-2);
  }

  .card-section {
    padding: 12px;
    background-color: var(--color-fill-1);
    border-radius: 8px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-2);
      margin-bottom: 8px;
    }

    .card-info {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .card-count {
        font-size: 18px;
        font-weight: 600;
        color: rgb(var(--orange-6));
      }
    }
  }
}

.calendar-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  :deep(.arco-card-body) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .calendar-title {
    font-size: 14px;
    font-weight: 500;
    min-width: 100px;
    text-align: center;
    color: var(--color-text-1);
  }

  .calendar-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 8px 0;

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 4px;

      .weekday {
        text-align: center;
        font-size: 12px;
        color: var(--color-text-3);
        padding: 4px 0;
      }
    }

    .calendar-days {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .calendar-day {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      position: relative;
      color: var(--color-text-2);
      min-height: 32px;

      &:hover:not(.other-month) {
        background-color: var(--color-fill-2);
      }

      &.other-month {
        opacity: 0.3;
        cursor: default;
      }

      &.today {
        background-color: rgba(var(--primary-6), 0.15);
        font-weight: 600;
        color: rgb(var(--primary-6));
      }

      &.signed {
        background-color: rgba(var(--green-6), 0.1);
        color: rgb(var(--green-6));
      }

      &.can-repair {
        background-color: rgba(var(--orange-6), 0.1);
        color: rgb(var(--orange-6));
        cursor: pointer;

        &:hover {
          background-color: rgba(var(--orange-6), 0.2);
        }
      }

      .day-mark {
        position: absolute;
        font-size: 10px;
        bottom: 2px;
        right: 4px;

        &.signed {
          color: rgb(var(--green-6));
        }

        &.repair {
          color: rgb(var(--orange-6));
        }
      }
    }
  }

  .calendar-legend {
    display: flex;
    justify-content: center;
    gap: 20px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border-2);

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--color-text-3);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.signed {
        background-color: rgb(var(--green-6));
      }

      &.repair {
        background-color: rgb(var(--orange-6));
      }
    }
  }
}

.records-card {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-self: flex-start;

  :deep(.arco-card-body) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .records-spin {
    flex: 1;
  }

  .records-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .record-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background-color: var(--color-fill-1);
    border-radius: 4px;
    font-size: 12px;

    .record-date {
      color: var(--color-text-1);
      min-width: 85px;
    }

    .record-reward {
      color: var(--color-text-3);
      margin-left: auto;
      font-size: 11px;
    }
  }

  .records-pagination {
    display: flex;
    justify-content: center;
    padding-top: 8px;
    border-top: 1px solid var(--color-border-2);
  }
}

@media (max-width: 992px) {
  .checkin-container {
    flex-wrap: wrap;
  }

  .status-card {
    width: 100%;
    order: 1;

    .stats-row {
      padding: 16px 0;
    }

    .stat-item .stat-num {
      font-size: 24px;
    }
  }

  .calendar-card {
    width: calc(50% - 8px);
    order: 2;
  }

  .records-card {
    width: calc(50% - 8px);
    order: 3;
  }
}

@media (max-width: 576px) {
  .checkin-page {
    padding: 8px;
    height: auto;
    min-height: calc(100vh - 64px);
    overflow: auto;
  }

  .checkin-container {
    flex-direction: column;
    height: auto;
  }

  .status-card {
    width: 100%;
  }

  .calendar-card,
  .records-card {
    width: 100%;
  }
}
</style>

<style>
@import '../../styles/theme.css';
</style>
