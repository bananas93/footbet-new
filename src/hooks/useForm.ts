import { useState } from 'react';

interface ValidationRules<T> {
  [key: string]: (value: any, values: FormValues<T>) => string;
}
interface FormErrors {
  [key: string]: string;
}
interface TouchedFields {
  [key: string]: boolean;
}

interface FormValues<T> {
  [key: string]: T;
}

interface useFormProps<T> {
  values: T;
  errors: FormErrors;
  touched: TouchedFields;
  clearForm: () => void;
  handleChange: (fieldName: string, value: any) => void;
  handleBlur: (fieldName: string) => void;
  handleFocus: (fieldName: string) => void;
  handleSubmit: () => void;
  setFieldError: (fieldName: string, error: string) => void;
}

export const useForm = <T>(
  initialValues: T,
  validationRules: ValidationRules<T>,
  onSubmit: (submittedValues: T) => void,
): useFormProps<T> => {
  const [values, setValues] = useState<T | FormValues<T>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const handleChange = (fieldName: string, value: any) => {
    setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: '' }));
    setValues((prevValues) => {
      if (isFormValues(prevValues)) {
        return { ...prevValues, [fieldName]: value };
      }
      return prevValues;
    });
    setTouched((prevTouched) => ({ ...prevTouched, [fieldName]: true }));
  };

  const handleFocus = (fieldName: string) => {
    setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: '' }));
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prevTouched) => ({ ...prevTouched, [fieldName]: true }));
    validateField(fieldName);
  };

  const validateField = (fieldName: string) => {
    if (validationRules[fieldName]) {
      const fieldError = validationRules[fieldName](getFieldValue(fieldName), values as FormValues<T>);
      setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: fieldError }));
    }
  };

  const clearForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const validateForm = () => {
    let formErrors: FormErrors = {};
    Object.keys(validationRules).forEach((fieldName) => {
      const fieldError = validationRules[fieldName](getFieldValue(fieldName), values as FormValues<T>);
      formErrors = { ...formErrors, [fieldName]: fieldError };
    });
    setErrors(formErrors);
    return Object.keys(formErrors).every((fieldName) => !formErrors[fieldName]);
  };

  const handleSubmit = () => {
    const isValid = validateForm();
    if (isValid) {
      onSubmit(values as T);
    }
  };

  const getFieldValue = (fieldName: string): any => {
    if (isFormValues(values)) {
      return values[fieldName];
    }
    return undefined;
  };

  const isFormValues = (obj: any): obj is FormValues<T> => {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
  };

  const setFieldError = (fieldName: string, error: string) => {
    setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: error }));
  };

  return {
    values: values as T,
    errors,
    touched,
    clearForm,
    handleChange,
    handleBlur,
    handleFocus,
    handleSubmit,
    setFieldError,
  };
};

export default useForm;
