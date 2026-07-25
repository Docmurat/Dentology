// app/doctor/courses/actions.ts
"use server";

// Курсы спикера: логика общая, живёт в app/doctor/course-actions.ts.
// Сюда по ошибке попала её полная копия — из-за этого правки владения
// не действовали: страницы импортируют из course-actions.ts, а менялся
// этот файл. Держим здесь только реэкспорт.
export {
  createSpeakerCourse,
  updateSpeakerCourse,
} from "@/app/doctor/course-actions";