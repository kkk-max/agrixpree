import { useState } from 'react';
import { Card, Tag, Button, Modal, Form, Input, Select, Typography, Space, Steps, Image, message, Avatar, Badge, Empty, Divider } from 'antd';
import { CheckOutlined, CloseOutlined, FileTextOutlined, UserOutlined, IdcardOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKycPending, reviewDocument, reviewKycStep } from '../../api/admin.api';
import { capitalize, getStatusColor } from '../../utils/formatters';

const { Text } = Typography;

const kycColors = { pending: 'orange', in_progress: 'blue', submitted: 'cyan', approved: 'green', rejected: 'red' };
const stepIcons = { identity: '🪪', address: '🏠', farm: '🌾', bank: '🏦', default: '📄' };

const KycReviewPage = () => {
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['kyc-pending'],
    queryFn: () => getKycPending().then(r => r.data.data)
  });

  const docReviewMutation = useMutation({
    mutationFn: ({ id, status, notes }) => reviewDocument(id, { status, notes }),
    onSuccess: () => { message.success('Document reviewed'); qc.invalidateQueries(['kyc-pending']); setModalOpen(false); form.resetFields(); }
  });

  const stepReviewMutation = useMutation({
    mutationFn: ({ userId, step, status, notes }) => reviewKycStep(userId, step, { status, notes }),
    onSuccess: () => { message.success('Step reviewed'); qc.invalidateQueries(['kyc-pending']); setModalOpen(false); form.resetFields(); }
  });

  const openReview = (target, type) => {
    setReviewTarget({ ...target, type });
    setModalOpen(true);
    form.resetFields();
  };

  const handleReview = (values) => {
    if (reviewTarget.type === 'document') docReviewMutation.mutate({ id: reviewTarget.id, ...values });
    else stepReviewMutation.mutate({ userId: selected.uuid, step: reviewTarget.step_number, ...values });
  };

  const users = data || [];
  const verificationSteps = selected?.verificationSteps || selected?.VerificationSteps || [];
  const documents = selected?.documents || selected?.Documents || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">KYC Review</h1>
          <p className="page-subtitle">{users.length} users pending verification</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Users list */}
        <Card title={<span style={{ fontWeight: 700, fontSize: 14 }}>Pending Users</span>} loading={isLoading} bodyStyle={{ padding: '8px 0' }}>
          {users.length === 0 && !isLoading && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <Text style={{ color: '#9ca3af', fontSize: 13 }}>All caught up! No pending KYC.</Text>
            </div>
          )}
          {users.map(u => (
            <div
              key={u.uuid}
              onClick={() => setSelected(u)}
              style={{
                padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s',
                background: selected?.uuid === u.uuid ? '#f0fdf4' : 'transparent',
                borderLeft: selected?.uuid === u.uuid ? '3px solid #16a34a' : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar size={36} style={{ background: u.role === 'farmer' ? '#dcfce7' : '#dbeafe', color: u.role === 'farmer' ? '#16a34a' : '#2563eb', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {u.name?.[0]?.toUpperCase()}
                </Avatar>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    <Tag color={u.role === 'farmer' ? 'green' : 'blue'} style={{ fontSize: 10 }}>{u.role}</Tag>
                    <Tag color={kycColors[u.kyc_status] || 'default'} style={{ fontSize: 10 }}>{capitalize(u.kyc_status?.replace('_', ' ') || '')}</Tag>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* Detail panel */}
        {!selected ? (
          <Card style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} bodyStyle={{ width: '100%' }}>
            <Empty
              image={<UserOutlined style={{ fontSize: 48, color: '#d1d5db' }} />}
              description={<Text style={{ color: '#9ca3af' }}>Select a user to review their KYC</Text>}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* User header */}
            <Card bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar size={56} style={{ background: selected.role === 'farmer' ? '#dcfce7' : '#dbeafe', color: selected.role === 'farmer' ? '#16a34a' : '#2563eb', fontWeight: 800, fontSize: 22 }}>
                  {selected.name?.[0]?.toUpperCase()}
                </Avatar>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>{selected.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{selected.mobile}{selected.email && ` · ${selected.email}`}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    <Tag color={selected.role === 'farmer' ? 'green' : 'blue'}>{selected.role}</Tag>
                    <Tag color={kycColors[selected.kyc_status] || 'default'}>{capitalize(selected.kyc_status?.replace('_', ' ') || '')}</Tag>
                  </div>
                </div>
              </div>
            </Card>

            {/* Verification Steps */}
            <Card title={<span style={{ fontWeight: 700 }}>Verification Steps</span>}>
              {verificationSteps.length === 0
                ? <Text style={{ color: '#9ca3af', fontSize: 13 }}>No verification steps submitted yet</Text>
                : verificationSteps.map((step, i) => (
                  <div key={step.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < verificationSteps.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {stepIcons[step.step_name] || stepIcons.default}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{capitalize(step.step_name || `Step ${step.step_number}`)}</div>
                      {step.review_notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{step.review_notes}</div>}
                    </div>
                    <Tag color={kycColors[step.status] || 'default'}>{capitalize(step.status || '')}</Tag>
                    <Button
                      size="small"
                      type={step.status === 'approved' ? 'default' : 'primary'}
                      onClick={() => openReview(step, 'step')}
                      style={step.status !== 'approved' ? { fontWeight: 600 } : {}}
                    >
                      {step.status === 'approved' ? 'Re-review' : 'Review'}
                    </Button>
                  </div>
                ))
              }
            </Card>

            {/* Documents */}
            <Card title={<span style={{ fontWeight: 700 }}>Documents <span style={{ color: '#9ca3af', fontWeight: 400 }}>({documents.length})</span></span>}>
              {documents.length === 0
                ? <Text style={{ color: '#9ca3af', fontSize: 13 }}>No documents uploaded yet</Text>
                : documents.map((doc, i) => (
                  <div key={doc.id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < documents.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', background: '#f9fafb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {doc.file_url && doc.mime_type?.startsWith('image')
                        ? <img src={doc.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <FileTextOutlined style={{ fontSize: 28, color: '#9ca3af' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{capitalize(doc.document_type?.replace('_', ' ') || 'Document')}</div>
                      <div style={{ marginTop: 4 }}>
                        <Tag color={kycColors[doc.status] || 'default'}>{capitalize(doc.status || '')}</Tag>
                      </div>
                      {doc.review_notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{doc.review_notes}</div>}
                    </div>
                    <Space>
                      {doc.file_url && !doc.mime_type?.startsWith('image') && (
                        <Button size="small" href={doc.file_url} target="_blank" icon={<FileTextOutlined />}>View PDF</Button>
                      )}
                      <Button
                        size="small"
                        type={doc.status === 'approved' ? 'default' : 'primary'}
                        onClick={() => openReview(doc, 'document')}
                        style={doc.status !== 'approved' ? { fontWeight: 600 } : {}}
                      >
                        Review
                      </Button>
                    </Space>
                  </div>
                ))
              }
            </Card>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>
          {reviewTarget?.type === 'document' ? `Review Document` : `Review Verification Step`}
        </span>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        width={440}
      >
        {reviewTarget && (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {reviewTarget.type === 'document'
                ? capitalize(reviewTarget.document_type?.replace('_', ' ') || 'Document')
                : capitalize(reviewTarget.step_name || `Step ${reviewTarget.step_number}`)
              }
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{selected?.name}</div>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleReview} requiredMark={false}>
          <Form.Item name="status" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Decision</span>} rules={[{ required: true, message: 'Select a decision' }]}>
            <Select size="large" placeholder="Select decision" options={[
              { value: 'approved', label: <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Approve</span> },
              { value: 'rejected', label: <span style={{ color: '#dc2626', fontWeight: 600 }}>❌ Reject</span> },
            ]} />
          </Form.Item>
          <Form.Item name="notes" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(required for rejection)</span></span>}>
            <Input.TextArea rows={3} placeholder="Review notes for the user..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={docReviewMutation.isPending || stepReviewMutation.isPending} style={{ fontWeight: 600 }}>Submit Review</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default KycReviewPage;
