<!-- src/views/RegistrationEdit.vue -->
<template>
  <Registration :is-edit-mode="true" />
</template>

<script>
import Registration from './Registration.vue';

export default {
  name: 'RegistrationEdit',
  components: {
    Registration
  },
  props: {
    isEditMode: {
      type: Boolean,
      default: true
    }
  }
}
</script>