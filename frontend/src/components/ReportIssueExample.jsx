import { useTranslation } from 'i18next';
import { useState } from 'react';

/**
 * Example component showing how to use i18n translations
 * This demonstrates best practices for multilingual components
 */
const ReportIssueExample = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    severity: 'medium',
    issueType: 'pothole',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(t('reports.successMessage'));
    // Send data with language preference
    const payload = {
      ...formData,
      language: i18n.language,
    };
    console.log('Submitting:', payload);
  };

  return (
    <div className="report-issue-container">
      <h1>{t('reports.title')}</h1>
      <p>{t('reports.description')}</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="issueType">{t('reports.issueType')}</label>
          <select
            id="issueType"
            name="issueType"
            value={formData.issueType}
            onChange={handleChange}
          >
            <option value="pothole">{t('reports.pothole')}</option>
            <option value="accident">{t('reports.accident')}</option>
            <option value="flooding">{t('reports.flooding')}</option>
            <option value="roadDamage">{t('reports.roadDamage')}</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="severity">{t('reports.severity')}</label>
          <select
            id="severity"
            name="severity"
            value={formData.severity}
            onChange={handleChange}
          >
            <option value="low">{t('reports.severityLow')}</option>
            <option value="medium">{t('reports.severityMedium')}</option>
            <option value="high">{t('reports.severityHigh')}</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('reports.uploadImage')}
          />
        </div>

        <button type="submit" className="btn-primary">
          {t('reports.submit')}
        </button>
        <button type="button" className="btn-secondary">
          {t('common.cancel')}
        </button>
      </form>

      <div className="language-info">
        <p>Current Language: {i18n.language}</p>
      </div>
    </div>
  );
};

export default ReportIssueExample;
