// src/stores/activities.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useActivitiesStore = defineStore("activities", () => {
  // 状态
  const activities = ref([
    {
      id: 1,
      name: "11月世界和平超度法会",
      type: "ceremony",
      participants: 342,
      date: "2023-11-15",
      status: "upcoming",
      icon: "🕯️",
    },
    {
      id: 2,
      name: "10月双十及朝山法会",
      type: "ceremony",
      participants: 567,
      date: "2023-10-10",
      status: "completed",
      icon: "🙏",
    },
    {
      id: 3,
      name: "9月朝山活动",
      type: "activity",
      participants: 289,
      date: "2023-09-20",
      status: "completed",
      icon: "⛰️",
    },
    {
      id: 4,
      name: "8月普度祭祖",
      type: "pudu",
      participants: 621,
      date: "2023-08-15",
      status: "completed",
      icon: "🍚",
    },
  ]);

  const monthlyStats = ref([
    { month: "1月", participants: 320, events: 3 },
    { month: "2月", participants: 280, events: 2 },
    { month: "3月", participants: 350, events: 4 },
    { month: "4月", participants: 410, events: 3 },
    { month: "5月", participants: 380, events: 5 },
    { month: "6月", participants: 420, events: 4 },
    { month: "7月", participants: 480, events: 6 },
    { month: "8月", participants: 621, events: 5 },
    { month: "9月", participants: 289, events: 3 },
    { month: "10月", participants: 567, events: 4 },
    { month: "11月", participants: 342, events: 2 },
    { month: "12月", participants: 180, events: 1 },
  ]);

  // Getter - 计算属性
  const totalParticipants = computed(() => {
    return activities.value.reduce(
      (sum, activity) => sum + activity.participants,
      0
    );
  });

  const upcomingActivities = computed(() => {
    return activities.value.filter(
      (activity) => activity.status === "upcoming"
    );
  });

  const completedActivities = computed(() => {
    return activities.value.filter(
      (activity) => activity.status === "completed"
    );
  });

  const getActivityById = computed(() => {
    return (id) => activities.value.find((activity) => activity.id === id);
  });

  const chartData = computed(() => {
    return {
      labels: monthlyStats.value.map((stat) => stat.month),
      datasets: [
        {
          label: "法会参与人数",
          data: monthlyStats.value.map((stat) => stat.participants),
          backgroundColor: "rgba(139, 69, 19, 0.6)",
          borderColor: "rgba(139, 69, 19, 1)",
          borderWidth: 2,
        },
      ],
    };
  });

  // Actions - 方法
  const fetchActivities = async () => {
    // 模拟API调用
    try {
      // 这里将来可以替换为真实的API调用
      // const response = await api.get('/activities')
      // activities.value = response.data

      console.log("获取活动数据成功");
      return activities.value;
    } catch (error) {
      console.error("获取活动数据失败:", error);
      throw error;
    }
  };

  const addActivity = async (newActivity) => {
    // 模拟API调用添加新活动
    try {
      const activity = {
        id: Math.max(...activities.value.map((a) => a.id)) + 1,
        ...newActivity,
        participants: 0,
        status: "upcoming",
      };
      activities.value.push(activity);
      return activity;
    } catch (error) {
      console.error("添加活动失败:", error);
      throw error;
    }
  };

  const updateActivityParticipants = async (activityId, newParticipants) => {
    // 模拟API调用更新参与人数
    try {
      const activity = activities.value.find((a) => a.id === activityId);
      if (activity) {
        activity.participants = newParticipants;
      }
      return activity;
    } catch (error) {
      console.error("更新活动参与人数失败:", error);
      throw error;
    }
  };

  const deleteActivity = async (activityId) => {
    // 模拟API调用删除活动
    try {
      const index = activities.value.findIndex((a) => a.id === activityId);
      if (index !== -1) {
        activities.value.splice(index, 1);
      }
    } catch (error) {
      console.error("删除活动失败:", error);
      throw error;
    }
  };

  const fetchMonthlyStats = async () => {
    // 模拟API调用获取月度统计
    try {
      // 这里将来可以替换为真实的API调用
      // const response = await api.get('/stats/monthly')
      // monthlyStats.value = response.data

      console.log("获取月度统计数据成功");
      return monthlyStats.value;
    } catch (error) {
      console.error("获取月度统计数据失败:", error);
      throw error;
    }
  };

  return {
    // 状态
    activities,
    monthlyStats,

    // Getter
    totalParticipants,
    upcomingActivities,
    completedActivities,
    getActivityById,
    chartData,

    // Actions
    fetchActivities,
    addActivity,
    updateActivityParticipants,
    deleteActivity,
    fetchMonthlyStats,
  };
});
