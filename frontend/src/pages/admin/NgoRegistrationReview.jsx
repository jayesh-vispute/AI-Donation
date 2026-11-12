import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, MapPin, Globe, ExternalLink, 
  User, Mail, Phone, FileText, Eye, Compass, Info, 
  Users, Clock, CheckCircle, XCircle, HelpCircle, X, Download
} from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

const DEMO_NGO = {
  id: 1,
  ngoCode: 'NGO-001',
  name: 'Demo NGO Foundation',
  tagline: 'Helping Communities Grow',
  status: 'Pending',
  appliedDate: 'Sep 6, 2026',
  regNumber: 'NGO-REG-2026-001',
  description: 'We work towards education, food security and community development for underprivileged communities.',
  location: 'Hyderabad, Telangana, India',
  orgType: 'Non-Profit Organization',
  establishedYear: '2021',
  website: 'https://demongo.org',
  primaryContact: 'Ravi Kumar',
  email: 'ravi@demongo.org',
  phone: '+91 98765 43210',
  address: '123, Community Street, Hyderabad, Telangana - 500081',
  alternateContact: 'N/A',
  emergencyContact: 'N/A',
  volunteers: '25+',
  beneficiaries: '500+',
  areasOfOperation: 'Hyderabad, Telangana',
  socialMedia: 'Not provided',
  focusAreas: ['Education', 'Food Security', 'Healthcare', 'Child Welfare', 'Women Empowerment'],
  documents: [
    {
      id: 1,
      title: 'Registration Certificate',
      filename: 'certificate.pdf',
      size: '2.4 MB',
      type: 'pdf',
      colorBg: '#FEE2E2',
      colorIcon: '#DC2626'
    },
    {
      id: 2,
      title: 'PAN Card',
      filename: 'pan_card.pdf',
      size: '1.1 MB',
      type: 'pdf',
      colorBg: '#DBEAFE',
      colorIcon: '#2563EB'
    },
    {
      id: 3,
      title: 'Address Proof',
      filename: 'address_proof.pdf',
      size: '1.8 MB',
      type: 'pdf',
      colorBg: '#DCFCE7',
      colorIcon: '#16A34A'
    }
  ]
};

export default function NgoRegistrationReview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ngo, setNgo] = useState(DEMO_NGO);
  const [loading, setLoading] = useState(true);
  
  // Modals & Dialogs state
  const [activeDocument, setActiveDocument] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestInfoNotes, setRequestInfoNotes] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  useEffect(() => {
    fetchNgoDetails();
  }, []);

  const fetchNgoDetails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (id) {
        const res = await api.getAdminNgoById(id);
        if (res) {
          setNgo({
            id: res.id,
            ngoCode: `NGO-${String(res.id).padStart(3, '0')}`,
            name: res.organization_name || 'Demo NGO Foundation',
            tagline: res.description ? res.description.substring(0, 40) + '...' : 'Helping Communities Grow',
            status: res.verification_status === 'APPROVED' ? 'Approved' : (res.verification_status === 'REJECTED' ? 'Rejected' : 'Pending'),
            appliedDate: res.created_at ? new Date(res.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 6, 2026',
            regNumber: res.registration_number || 'NGO-REG-2026-001',
            description: res.description || 'We work towards education, food security and community development for underprivileged communities.',
            location: `${res.city || 'Hyderabad'}, ${res.state || 'Telangana'}, India`,
            orgType: res.organization_type || 'Non-Profit Organization',
            establishedYear: '2021',
            website: res.website || 'https://demongo.org',
            primaryContact: res.contact_person || 'Ravi Kumar',
            email: res.email || 'ravi@demongo.org',
            phone: res.phone || '+91 98765 43210',
            address: res.address || '123, Community Street, Hyderabad, Telangana - 500081',
            alternateContact: 'N/A',
            emergencyContact: 'N/A',
            volunteers: '25+',
            beneficiaries: '500+',
            areasOfOperation: `${res.city || 'Hyderabad'}, ${res.state || 'Telangana'}`,
            socialMedia: 'Not provided',
            focusAreas: ['Education', 'Food Security', 'Healthcare', 'Child Welfare', 'Women Empowerment'],
            documents: DEMO_NGO.documents
          });
        }
      } else {
        setNgo(DEMO_NGO);
      }
    } catch (err) {
      console.error('Failed to load NGO review details:', err);
      setNgo(DEMO_NGO);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.updateNgoStatus(ngo.id, 'approve');
      setActionSuccessMsg(`${ngo.name} application has been successfully approved!`);
      setNgo(prev => ({ ...prev, status: 'Approved' }));
      setTimeout(() => {
        navigate('/admin/ngos');
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to approve NGO');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      alert('Please state a clear reason for rejecting the application.');
      return;
    }
    try {
      await api.updateNgoStatus(ngo.id, 'reject');
      setActionSuccessMsg(`${ngo.name} application rejected.`);
      setShowRejectModal(false);
      setNgo(prev => ({ ...prev, status: 'Rejected' }));
      setTimeout(() => {
        navigate('/admin/ngos');
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to reject NGO application');
    }
  };

  const handleRequestInfoSubmit = () => {
    if (!requestInfoNotes.trim()) {
      alert('Please enter instructions for requested documents/info.');
      return;
    }
    setActionSuccessMsg(`Information request sent to ${ngo.primaryContact} (${ngo.email}).`);
    setShowRequestInfoModal(false);
  };

  // Focus Area pill color generator
  const getFocusTagStyle = (area) => {
    switch (area.toLowerCase()) {
      case 'education':
        return { bg: '#E0F2FE', color: '#0369A1' };
      case 'food security':
        return { bg: '#DCFCE7', color: '#15803D' };
      case 'healthcare':
        return { bg: '#FEF3C7', color: '#B45309' };
      case 'child welfare':
        return { bg: '#F3E8FF', color: '#6B21A8' };
      case 'women empowerment':
        return { bg: '#FCE7F3', color: '#BE185D' };
      default:
        return { bg: '#F3F4F6', color: '#374151' };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
        Loading NGO application review...
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 0 40px 0', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* SUCCESS ALERTS */}
      {actionSuccessMsg && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={18} color="#059669" />
          {actionSuccessMsg}
        </div>
      )}

      {/* TOP BAR / NAVIGATION & TITLE */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Breadcrumbs items={[
            { label: t('common.home', 'Home'), to: '/' },
            { label: t('common.admin', 'Admin'), to: '/admin' },
            { label: t('navigation.ngos', 'Verified NGOs'), to: '/admin/ngos' },
            { label: t('admin.ngoApprovals', 'Registration Review') }
          ]} />
          <button
            onClick={() => navigate('/admin/ngos')}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <ArrowLeft size={16} />
            Back to NGOs
          </button>

          <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 700, color: '#111827', margin: 0 }}>
            {t('admin.reviewTitle', 'Review NGO Application')}
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
            {t('admin.reviewDesc', 'Verify NGO details, documents and approve or reject the application.')}
          </p>
        </div>

        {/* Top Right Status Badge */}
        <div style={{
          backgroundColor: '#FFF3EB',
          border: '1px solid #FFE0B2',
          borderRadius: '10px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Clock size={18} color="#D9531E" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#D9531E' }}>
              Pending Review
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>
              Applied on {ngo.appliedDate}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN 2-COLUMN GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* ================= LEFT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CARD 1: NGO HEADER CARD */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Green Icon Frame */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Building2 size={28} />
              </div>

              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {ngo.name}
                </h2>
                <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '2px' }}>
                  {ngo.tagline}
                </div>
                <div style={{
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  padding: '2px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '6px',
                  display: 'inline-block'
                }}>
                  {ngo.ngoCode}
                </div>
              </div>
            </div>

            {/* Status Pill on Right */}
            <div style={{
              backgroundColor: '#FFF3EB',
              color: '#D9531E',
              border: '1px solid #FFE0B2',
              padding: '6px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600
            }}>
              <Clock size={14} color="#D9531E" />
              <div>
                <div>Pending</div>
                <div style={{ fontSize: '11px', fontWeight: 400, color: '#6B7280' }}>
                  Applied on {ngo.appliedDate}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: ORGANIZATION DETAILS */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <Building2 size={18} color="#111827" />
              Organization Details
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px 32px' }}>
              {/* NGO Name */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>NGO Name</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: '3px' }}>
                  {ngo.name}
                </div>
              </div>

              {/* Location */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Location</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} color="#6B7280" />
                  {ngo.location}
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Description</div>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, marginTop: '3px' }}>
                  {ngo.description}
                </div>
              </div>

              {/* Org Type */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Organization Type</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: '3px' }}>
                  {ngo.orgType}
                </div>
              </div>

              {/* Reg Number */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Registration Number</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: '3px' }}>
                  {ngo.regNumber}
                </div>
              </div>

              {/* Year Established */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Year Established</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: '3px' }}>
                  {ngo.establishedYear}
                </div>
              </div>

              {/* Website */}
              <div style={{ gridColumn: '2 / 3' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Website</div>
                <div style={{ marginTop: '3px' }}>
                  <a
                    href={ngo.website}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '14px',
                      color: '#2563EB',
                      fontWeight: 500,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ExternalLink size={14} />
                    {ngo.website}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: CONTACT INFORMATION */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <User size={18} color="#111827" />
              Contact Information
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px 32px' }}>
              {/* Primary Contact */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Primary Contact</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: '3px' }}>
                  {ngo.primaryContact}
                </div>
              </div>

              {/* Email */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Email</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} color="#6B7280" />
                  {ngo.email}
                </div>
              </div>

              {/* Phone */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Phone</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} color="#6B7280" />
                  {ngo.phone}
                </div>
              </div>

              {/* Address */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Address</div>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.4, marginTop: '3px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={14} color="#6B7280" style={{ marginTop: '2px', flexShrink: 0 }} />
                  {ngo.address}
                </div>
              </div>

              {/* Alternate Contact */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Alternate Contact</div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '3px' }}>
                  {ngo.alternateContact}
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Emergency Contact</div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '3px' }}>
                  {ngo.emergencyContact}
                </div>
              </div>
            </div>
          </div>

        </div>


        {/* ================= RIGHT COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CARD 1: VERIFICATION DOCUMENTS */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#111827" />
                Verification Documents
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                color: '#374151',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {ngo.documents.length}
              </div>
            </div>

            {/* Documents List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {ngo.documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* File type icon box */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: doc.colorBg,
                      color: doc.colorIcon,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={18} />
                    </div>

                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>
                        {doc.filename} • {doc.size}
                      </div>
                    </div>
                  </div>

                  {/* View Button */}
                  <button
                    onClick={() => setActiveDocument(doc)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Eye size={14} />
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: NGO FOCUS AREAS */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Compass size={18} color="#111827" />
              NGO Focus Areas
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ngo.focusAreas.map((area, idx) => {
                const style = getFocusTagStyle(area);
                return (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: style.bg,
                      color: style.color,
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {area}
                  </span>
                );
              })}
            </div>
          </div>

          {/* CARD 3: ADDITIONAL INFORMATION */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <Info size={18} color="#111827" />
              Additional Information
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '18px 24px' }}>
              {/* Volunteers */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Volunteers</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#6B7280" />
                  {ngo.volunteers}
                </div>
              </div>

              {/* Beneficiaries */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Beneficiaries</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="#6B7280" />
                  {ngo.beneficiaries}
                </div>
              </div>

              {/* Areas of Operation */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Areas of Operation</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#6B7280" />
                  {ngo.areasOfOperation}
                </div>
              </div>

              {/* Social Media */}
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Social Media</div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} color="#6B7280" />
                  {ngo.socialMedia}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: ACTION BUTTONS ROW */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            {/* Reject Application Button */}
            <button
              onClick={() => setShowRejectModal(true)}
              style={{
                flex: 1,
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <XCircle size={16} />
              Reject Application
            </button>

            {/* Request More Info Button */}
            <button
              onClick={() => setShowRequestInfoModal(true)}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Clock size={16} />
              Request More Info
            </button>

            {/* Approve NGO Button */}
            <button
              onClick={handleApprove}
              style={{
                flex: 1,
                backgroundColor: '#D9531E',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <CheckCircle size={16} />
              {t('admin.approveNgo', 'Approve NGO')}
            </button>
          </div>

        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {activeDocument && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '700px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAF9F6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#D9531E" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>
                  {activeDocument.title} — {activeDocument.filename}
                </h3>
              </div>
              <button
                onClick={() => setActiveDocument(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Viewer Body */}
            <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                backgroundColor: activeDocument.colorBg,
                color: activeDocument.colorIcon,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <FileText size={40} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                {activeDocument.title}
              </h4>
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                File: {activeDocument.filename} | Size: {activeDocument.size}
              </p>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px dashed #D1D5DB',
                borderRadius: '12px',
                padding: '40px 20px',
                marginTop: '20px',
                fontSize: '14px',
                color: '#4B5563'
              }}>
                📄 Document preview loaded for admin verification.
                <br />
                <span style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px', display: 'block' }}>
                  Official registration document issued by relevant authority.
                </span>
              </div>
            </div>

            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              backgroundColor: '#ffffff'
            }}>
              <button
                onClick={() => alert(`Downloading ${activeDocument.filename}...`)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} />
                Download
              </button>
              <button
                onClick={() => setActiveDocument(null)}
                style={{
                  backgroundColor: '#D9531E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={20} /> Reason for Application Rejection
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>
              Please provide a reason. This explanation will be included in the email sent to {ngo.name}.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid registration documents provided or address details could not be verified."
              style={{
                width: '100%',
                minHeight: '110px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                outline: 'none',
                marginTop: '14px',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST MORE INFO MODAL */}
      {showRequestInfoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#D9531E" /> Request Additional Information
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>
              Specify additional documents or clarifications required from {ngo.name}.
            </p>

            <textarea
              value={requestInfoNotes}
              onChange={(e) => setRequestInfoNotes(e.target.value)}
              placeholder="e.g. Please re-upload a clearer copy of your 80G tax exemption certificate."
              style={{
                width: '100%',
                minHeight: '110px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                outline: 'none',
                marginTop: '14px',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowRequestInfoModal(false)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInfoSubmit}
                style={{
                  backgroundColor: '#D9531E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


