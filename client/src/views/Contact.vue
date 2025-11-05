<template>
  <div class="page">
    <h2>联系我们</h2>
    <p>如果您有任何问题或建议，请填写以下表单，我们将尽快与您联系。</p>
    
    <ContactForm />
  </div>
</template>

<script>
import ContactForm from '@/components/ContactForm.vue'

export default {
  name: 'Contact',
  components: {
    ContactForm
  }
}
</script>