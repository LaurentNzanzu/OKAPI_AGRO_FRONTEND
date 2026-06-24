// frontend/src/components/validations/WorkflowValidation.jsx
import React from 'react';
import {
  Box, Stepper, Step, StepLabel,
  Paper, Typography, Chip, Divider, List, ListItem,
  ListItemIcon, ListItemText,
} from '@mui/material';
import {
  CheckCircle, HourglassEmpty, Cancel, Person,
  Comment, CalendarToday
} from '@mui/icons-material';
import { formatDate } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';
import {
  VALIDATION_ROLE_ICONS,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  BriefcaseIcon,
  BanknotesIcon,
} from '../ui/icons';

const WorkflowValidation = ({ workflow }) => {
  const { t } = useTranslation();

  if (!workflow) return null;

  const STEPS = [
    { ordre: 'DG', label: t('validationsWorkflow.dg'), Icon: VALIDATION_ROLE_ICONS.DG || BriefcaseIcon },
    { ordre: 'COMPTABLE', label: t('validationsWorkflow.comptable'), Icon: VALIDATION_ROLE_ICONS.COMPTABLE },
    { ordre: 'CAISSE', label: t('validationsWorkflow.caisse'), Icon: VALIDATION_ROLE_ICONS.CAISSE || BanknotesIcon }
  ];

  const getStepIcon = (etape) => {
    const validation = workflow.validations_realisees?.find(
      v => v.ordre === etape.ordre
    );

    if (!validation) {
      return <HourglassEmpty sx={{ color: 'text.secondary' }} />;
    }

    if (validation.decision === 'APPROUVE') {
      return <CheckCircle sx={{ color: 'success.main' }} />;
    }
    if (validation.decision === 'REJETE') {
      return <Cancel sx={{ color: 'error.main' }} />;
    }
    return <HourglassEmpty sx={{ color: 'warning.main' }} />;
  };

  const getStepStatus = (etape) => {
    const validation = workflow.validations_realisees?.find(
      v => v.ordre === etape.ordre
    );

    if (!validation) {
      return {
        status: 'pending',
        color: 'text.secondary',
        label: t('validationsWorkflow.pending')
      };
    }

    if (validation.decision === 'APPROUVE') {
      return {
        status: 'approved',
        color: 'success.main',
        label: t('validationsWorkflow.approved')
      };
    }
    if (validation.decision === 'REJETE') {
      return {
        status: 'rejected',
        color: 'error.main',
        label: t('validationsWorkflow.rejected')
      };
    }
    return {
      status: 'pending',
      color: 'warning.main',
      label: t('validationsWorkflow.inProgress')
    };
  };

  const getCurrentStep = () => {
    const currentStatut = workflow.statut_actuel;
    
    if (currentStatut === 'BROUILLON' || currentStatut === 'EN_VALIDATION') return 0;
    if (currentStatut === 'DG_VALIDE') return 1;
    if (currentStatut === 'COMPTABLE_VALIDE') return 2;
    if (currentStatut === 'CAISSE_VALIDE' || currentStatut === 'APPROUVEE') return 3;
    if (currentStatut === 'REJETE') return -1;
    
    return 0;
  };

  const activeStep = getCurrentStep();

  const getCurrentStateLabel = () => {
    if (workflow.statut_actuel === 'APPROUVEE') return t('validationsWorkflow.requestApproved');
    if (workflow.statut_actuel === 'REJETE') return t('validationsWorkflow.requestRejected');
    return t('validationsWorkflow.waitingValidation', { role: STEPS[activeStep]?.label || '...' });
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ArrowPathIcon style={{ width: 20, height: 20 }} />
        {t('validationsWorkflow.title')}
      </Typography>
      
      <Divider sx={{ mb: 3 }} />

      <Stepper 
        activeStep={activeStep >= 0 ? activeStep : 0} 
        alternativeLabel
        sx={{ mb: 4 }}
      >
        {STEPS.map((etape) => {
          const stepInfo = getStepStatus(etape);
          const validation = workflow.validations_realisees?.find(
            v => v.ordre === etape.ordre
          );
          const StepIcon = etape.Icon;

          return (
            <Step 
              key={etape.ordre}
              completed={stepInfo.status === 'approved'}
              error={stepInfo.status === 'rejected'}
            >
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getStepIcon(etape)}
                  </Box>
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: stepInfo.color,
                    fontWeight: stepInfo.status === 'approved' ? 600 : 400
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <StepIcon style={{ width: 16, height: 16 }} />
                    {etape.label}
                  </Typography>
                  <Typography variant="caption" color={stepInfo.color}>
                    {stepInfo.label}
                  </Typography>
                  {validation && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {validation.validateur}
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {workflow.validations_realisees?.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ClipboardDocumentListIcon style={{ width: 16, height: 16 }} />
            {t('validationsWorkflow.history')}
          </Typography>
          <List dense>
            {workflow.validations_realisees.map((validation, idx) => (
              <ListItem 
                key={idx}
                sx={{ 
                  bgcolor: validation.decision === 'REJETE' ? 'error.50' : 'success.50',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {validation.decision === 'APPROUVE' ? (
                    <CheckCircle color="success" fontSize="small" />
                  ) : (
                    <Cancel color="error" fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`${validation.ordre} — ${validation.decision === 'APPROUVE' ? t('validationsWorkflow.approvedDecision') : t('validationsWorkflow.rejectedDecision')}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondary={
                    <>
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person fontSize="inherit" /> {validation.validateur}
                      </Typography>
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday fontSize="inherit" /> {formatDate(validation.date)}
                      </Typography>
                      {validation.commentaire && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.5 }}>
                          <Comment fontSize="inherit" /> "{validation.commentaire}"
                        </Typography>
                      )}
                    </>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
        <Typography variant="body2" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HourglassEmpty fontSize="small" />
          <strong>{t('validationsWorkflow.currentState')}</strong> {getCurrentStateLabel()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default WorkflowValidation;
