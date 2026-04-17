"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sidenav } from "@/components/layout/Sidenav";

import { API_BASE_URL } from '@/lib/api-base';

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsappNumber: string;
  countryCode: string;
  isVerified: boolean;
  createdAt: string;
}

interface CandidateDetail {
  id: string;
  whatsappNumber: string;
  countryCode: string;
  personalInformation: any;
  summary: any;
  education: any[];
  workExperience: any[];
  skills: any[];
  languages: any[];
  careerPreferences: any;
  resume: any;
  cvAnalysis: any;
  certifications: any[];
}

export default function SuperAdminPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const limit = 10;

  // Fetch candidates
  const fetchCandidates = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/candidates?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCandidates(result.data.candidates);
          setTotalCount(result.data.pagination.total);
          setTotalPages(result.data.pagination.totalPages);
          setCurrentPage(result.data.pagination.page);
        }
      } else {
        console.error("Failed to fetch candidates");
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(1);
  }, []);

  // Fetch candidate details
  const fetchCandidateDetails = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSelectedCandidate(result.data);
          setShowDetailModal(true);
        }
      } else {
        alert("Failed to fetch candidate details");
      }
    } catch (error) {
      console.error("Error fetching candidate details:", error);
      alert("Error fetching candidate details");
    }
  };

  // Delete candidate
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this candidate?")) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Remove from list
          setCandidates(candidates.filter((c) => c.id !== id));
          setTotalCount(totalCount - 1);
          alert("Candidate deleted successfully");
        }
      } else {
        const result = await response.json();
        alert(result.message || "Failed to delete candidate");
      }
    } catch (error) {
      console.error("Error deleting candidate:", error);
      alert("Error deleting candidate");
    } finally {
      setDeletingId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Sidenav>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Candidates Management</h2>
          <p className="text-gray-600">Total Candidates: <span className="font-semibold text-gray-800">{totalCount}</span></p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg">
            <div className="text-gray-500">Loading candidates...</div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No candidates found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        CANDIDATE ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        FULL NAME
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        EMAIL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        PHONE NUMBER
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        CREATED DATE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {candidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {candidate.id.substring(0, 12)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {candidate.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {candidate.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {candidate.phoneNumber || candidate.whatsappNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(candidate.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchCandidateDetails(candidate.id)}
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(candidate.id)}
                              disabled={deletingId === candidate.id}
                              className="px-4 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === candidate.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchCandidates(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchCandidates(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {showDetailModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Candidate Details</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCandidate(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {/* Summary */}
              {selectedCandidate.summary && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 underline decoration-blue-200">Executive Summary</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed italic border border-gray-100">
                    "{selectedCandidate.summary.summaryText}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div>
                  {/* Personal Information */}
                  {selectedCandidate.personalInformation && (
                    <div className="mb-8 bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                      <h4 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-4">Personal Profile</h4>
                      <div className="space-y-3 text-[13px]">
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">Full Name</span>
                          <span className="text-gray-900 font-semibold">{selectedCandidate.personalInformation.fullName || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">Email</span>
                          <span className="text-gray-900 font-medium">{selectedCandidate.personalInformation.email || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">WhatsApp</span>
                          <span className="text-gray-900 font-medium">({selectedCandidate.countryCode}) {selectedCandidate.whatsappNumber || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">Gender</span>
                          <span className="text-gray-900">{selectedCandidate.personalInformation.gender || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">DOB</span>
                          <span className="text-gray-900">{formatDate(selectedCandidate.personalInformation.dateOfBirth)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Location</span>
                          <span className="text-gray-900">{selectedCandidate.personalInformation.city}, {selectedCandidate.personalInformation.country}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">🎓</span>
                        Education
                      </h4>
                      <div className="space-y-4">
                        {selectedCandidate.education.map((edu: any, index: number) => (
                          <div key={index} className="relative pl-6 border-l-2 border-blue-200">
                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500" />
                            <div className="font-bold text-gray-900 text-sm">{edu.degree}</div>
                            <div className="text-xs font-semibold text-blue-600">{edu.institution}</div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              {edu.startYear} - {edu.endYear || "Present"} | {edu.specialization}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Core Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.map((skill: any, index: number) => (
                          <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
                            {skill.skillName} <span className="text-slate-400 font-normal">({skill.proficiency})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div>
                  {/* WORK EXPERIENCE */}
                  {selectedCandidate.workExperience && selectedCandidate.workExperience.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">💼</span>
                        Work History
                      </h4>
                      <div className="space-y-5">
                        {selectedCandidate.workExperience.map((exp: any, index: number) => (
                          <div key={index} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-bold text-gray-900">{exp.jobTitle}</div>
                              <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                {exp.employmentType}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-500 mb-2">{exp.company} • {exp.workLocation}</div>
                            <div className="text-[11px] font-medium text-gray-400 mb-3">
                              {formatDate(exp.startDate)} — {exp.endDate ? formatDate(exp.endDate) : "Present"}
                            </div>
                            {exp.responsibilities && (
                              <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-3">{exp.responsibilities}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career Preferences */}
                  {selectedCandidate.careerPreferences && (
                    <div className="mb-8 bg-violet-50/50 p-5 rounded-2xl border border-violet-100">
                      <h4 className="text-sm font-bold text-violet-800 uppercase tracking-widest mb-4">Future Preferences</h4>
                      <div className="space-y-3 text-[13px]">
                        <div className="flex flex-col gap-1 border-b border-violet-100/50 pb-2">
                          <span className="text-violet-400 font-bold text-[10px] uppercase">Roles</span>
                          <span className="text-gray-900 font-semibold">{(selectedCandidate.careerPreferences.preferredRoles || []).join(", ") || "N/A"}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-b border-violet-100/50 pb-2">
                          <span className="text-violet-400 font-bold text-[10px] uppercase">Locations</span>
                          <span className="text-gray-900 font-medium">{(selectedCandidate.careerPreferences.preferredLocations || []).join(", ") || "N/A"}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-violet-500 font-bold">Expectation</span>
                          <span className="text-gray-900 font-black">{selectedCandidate.careerPreferences.preferredSalary} {selectedCandidate.careerPreferences.preferredCurrency}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Extra Sections (Projects, Certs, CV Scores) */}
              <div className="mt-4 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CV Score</div>
                   <div className="text-4xl font-black text-blue-600">{selectedCandidate.cvAnalysis?.cvScore || "0"}%</div>
                   <div className="mt-2 text-[11px] font-bold text-slate-500">ATS Readiness: {selectedCandidate.cvAnalysis?.atsScore || "N/A"}%</div>
                </div>
                
                <div className="md:col-span-2 bg-gray-50/30 p-5 rounded-2xl border border-dashed border-gray-200">
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">AI Suggestions</h4>
                   <div className="text-sm text-gray-600 leading-normal italic">
                     {Array.isArray(selectedCandidate.cvAnalysis?.suggestions) 
                       ? selectedCandidate.cvAnalysis.suggestions.slice(0, 3).map((s: string, i: number) => (
                           <p key={i} className="mb-1">• {s}</p>
                         ))
                       : typeof selectedCandidate.cvAnalysis?.suggestions === 'string'
                         ? selectedCandidate.cvAnalysis.suggestions.substring(0, 200) + (selectedCandidate.cvAnalysis.suggestions.length > 200 ? "..." : "")
                         : "No specific AI insights generated yet."
                     }
                   </div>
                </div>

              </div>

              {/* Languages */}
              {selectedCandidate.languages && selectedCandidate.languages.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-tighter">Communication</h4>
                  <div className="flex flex-wrap gap-4">
                    {selectedCandidate.languages.map((lang: any, index: number) => (
                      <div key={index} className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{lang.name}</span>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">{lang.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Sidenav>

  );
}
