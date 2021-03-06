import SchemaList from "../components/pages/schemas/Schema.List";

export interface ApiError {
    statusCode: number;
    message: string;
}


export const TopicActions = ['seeTopic', 'viewPartitions', 'viewMessages', 'useSearchFilter', 'viewConsumers', 'viewConfig'] as const;
export type TopicAction = 'all' | typeof TopicActions[number];

export class TopicDetail {
    topicName: string;
    isInternal: boolean;
    partitionCount: number;
    replicationFactor: number;
    cleanupPolicy: string;
    logDirSize: number; // how much space this topic takes up (files in its log dir)
    allowedActions: TopicAction[] | undefined;

    // Added by frontend
    // messageCount: number;
}

export class GetTopicsResponse {
    topics: TopicDetail[];
}

export interface Partition {
    id: number;
    waterMarkLow: number;
    waterMarkHigh: number;
}

export interface GetPartitionsResponse {
    topicName: string;
    partitions: Partition[];
}


export interface TopicConsumer {
    groupId: string
    summedLag: number
}

export interface GetTopicConsumersResponse {
    topicName: string;
    topicConsumers: TopicConsumer[];
}


export type MessageDataType = 'none' | 'json' | 'xml' | 'avro' | 'text' | 'binary';
export type CompressionType = 'uncompressed' | 'gzip' | 'snappy' | 'lz4' | 'zstd' | 'unknown';
export interface Payload {
    payload: any, // json obj
    encoding: MessageDataType, // actual format of the message (before the backend converted it to json)
    avroSchemaId: number,
    size: number,
}

export interface TopicMessage {
    partitionID: number,
    offset: number,
    timestamp: number,

    compression: CompressionType,
    isTransactional: boolean,

    headers: {
        key: string,
        value: Payload,
    }[]
    key: Payload,
    value: Payload,

    isValueNull: boolean, // todo: rename to isTombstone
    // todo: Tab.Messages/index.tsx: isFilterMatch(): use 'keyJson' instead

    // Added by the frontend (sometimes)
    valueJson: string,
    valueBinHexPreview: string,
}

export interface ListMessageResponse {
    elapsedMs: number,
    fetchedMessages: number,
    isCancelled: boolean,
    messages: TopicMessage[],
}

export interface GetTopicMessagesResponse {
    kafkaMessages: ListMessageResponse,
}



export interface KafkaError {
    code: number,
    message: string,
    description: string
}

export interface TopicConfigEntry {
    name: string,
    value: string,
    isDefault: boolean,
}
export interface TopicDescription {
    topicName: string
    configEntries: TopicConfigEntry[]
    error: KafkaError | null
}
export interface TopicConfigResponse {
    topicDescription: TopicDescription
}
export interface TopicDocumentation {
    // if false: topic documentation is not configured
    isEnabled: boolean;
    // empty: actually empty
    // null:  no .md docu file found for this topic
    markdown: string | null; // base64

    // added by frontend:
    text: string | null; // atob(markdown)
}
export interface TopicDocumentationResponse {
    topicName: string;
    documentation: TopicDocumentation;
}




export interface GroupMemberAssignment {
    topicName: string;
    partitionIds: number[];

}
export interface GroupMemberDescription {
    id: string; // unique ID assigned to the member after login
    clientId: string; // custom id reported by the member
    clientHost: string; // address/host of the connection
    assignments: GroupMemberAssignment[]; // topics+partitions that the worker is assigned to

}


export const GroupActions = ['seeConsumerGroup'] as const;
export type GroupAction = 'all' | typeof GroupActions[number];

export interface GroupDescription {
    groupId: string; // name of the group
    state: string; // Dead, Initializing, Rebalancing, Stable
    protocolType: string; // Will be "consumer" if we can decode the members; otherwise ".members" will be empty, which happens for "sr" (for schema registry) for example
    members: GroupMemberDescription[]; // members (consumers) that are currently present in the group
    coordinatorId: number;
    lag: GroupLagDescription;
    allowedActions: GroupAction[];

    // Computed by frontend
    lagSum: number;
}

export interface GroupLagDescription {
    groupId: string;
    topicLags: TopicLag[];
}

export interface TopicLag {
    topic: string; // name
    summedLag: number;

    partitionCount: number; // number of partitions the topic has
    partitionsWithOffset: number; // number of partitions that have an active offset in this group

    // only lists partitions that have a commited offset (independent of whether or not a member is currently assigned to it)
    partitionLags: { lag: number, partitionId: number }[]
}

export interface GetConsumerGroupsResponse {
    consumerGroups: GroupDescription[];
}







export interface Broker {
    brokerId: number;
    logDirSize: number; // bytes of the whole directory
    address: string;
    rack: string;
}

export interface ClusterInfo {
    brokers: Broker[];
    controllerId: number;
    kafkaVersion: string;
}

export interface ClusterInfoResponse {
    clusterInfo: ClusterInfo;
}


export interface ClusterConfigResponse {
    clusterConfig: ClusterConfig;
}

export interface ClusterConfig {
    brokerConfigs: BrokerConfig[];
    requestErrors: {
        brokerId: number;
        errorMessage: string;
    }[];
}

export interface BrokerConfig {
    brokerId: number;
    configEntries: BrokerConfigEntry[];
}

export interface BrokerConfigEntry {
    name: string;
    value: string;
    isDefault: boolean;
}




// Current user
export interface User {
    id: string,
    internalIdentifier: string,
    providerID: number,
    providerName: string,
    meta: {
        email: string,
        name: string,
        avatarUrl: string,
    },
}
export interface Seat {
    id: string, // id of seat
    licenseId: string, // shouldn't that be censored??
    user: User, // user representation of firestore? should be removed...
    lastActivity: string, // is a datetime string, should probably be a "UnixMillis"
}
export interface UserData {
    user: User;
    seat: Seat;
    canManageKowl: boolean;
    canListAcls: boolean;
}



export interface AdminInfo {
    roles: Role[];
    roleBindings: RoleBinding[];
    users: UserDetails[];
}

export interface UserDetails {
    internalIdentifier: string;
    oauthUserId: string;
    loginProviderId: number;
    loginProvider: string;
    bindingIds: string[]; // rolebindings
    audits: {
        [roleName: string]: string[]; // roleName to (RoleBinding.ephemeralID)[]
    };

    // Added by frontend:
    bindings: RoleBinding[];
    grantedRoles: {
        role: Role;
        grantedBy: RoleBinding[];
    }[];
}

export interface PermissionAudit {
    roleName: string; // Role.name
    grantedBy: string; // RoleBinding.ephemeralId
}

export interface RoleBinding {
    ephemeralId: string;
    metadata: { [key: string]: string; };
    subjects: Subject[];
    roleName: string;

    // Added by frontend:
    resolvedRole: Role;
}

export interface Role {
    name: string;
    permissions: Permission[];
}

export interface Permission {
    resourceName: string;
    resourceId: number;

    // Those 3 may be missing or contain a single empty string.
    // The frontend fixes / normalizes those cases to '[]'.
    allowedActions: string[];
    includes: string[];
    excludes: string[];
}

export interface Subject {
    name: string;

    organization: string;

    subjectKind: number;
    subjectKindName: string;

    provider: number;
    providerName: string;
}


export interface TopicPermissions {
    canSeeTopic: boolean;
    canViewTopicPartitions: boolean;
    canSeeTopicConfig: boolean;
    canUseSearchFilters: boolean;
    canViewTopicMessages: boolean;
    canViewTopicConsumers: boolean;
}


//
// ACLs

// See: https://github.com/Shopify/sarama/blob/master/acl_types.go
export enum AclResourceType {
    AclResourceUnknown,
    AclResourceAny,
    AclResourceTopic,
    AclResourceGroup,
    AclResourceCluster,
    AclResourceTransactionalID
}

export enum AclResourcePatternTypeFilter {
    AclPatternUnknown,
    AclPatternAny,
    AclPatternMatch,
    AclPatternLiteral,
    AclPatternPrefixed
}

export enum AclOperation {
    AclOperationUnknown,
    AclOperationAny,
    AclOperationAll,
    AclOperationRead,
    AclOperationWrite,
    AclOperationCreate,
    AclOperationDelete,
    AclOperationAlter,
    AclOperationDescribe,
    AclOperationClusterAction,
    AclOperationDescribeConfigs,
    AclOperationAlterConfigs,
    AclOperationIdempotentWrite
}

export enum AclPermissionType {
    AclPermissionUnknown,
    AclPermissionAny,
    AclPermissionDeny,
    AclPermissionAllow
}

// list all:
//   /api/acls?resourceType=1&resourcePatternTypeFilter=1&operation=1&permissionType=1
export interface AclRequest {
    resourceType: AclResourceType;
    resourceName?: string;
    resourcePatternTypeFilter: AclResourcePatternTypeFilter;
    principal?: string;
    host?: string;
    operation: AclOperation;
    permissionType: AclPermissionType;
}

export const AclRequestDefault = {
    resourceType: AclResourceType.AclResourceAny,
    resourceName: "",
    resourcePatternTypeFilter: AclResourcePatternTypeFilter.AclPatternAny,
    principal: "",
    host: "",
    operation: AclOperation.AclOperationAny,
    permissionType: AclPermissionType.AclPermissionAny,
} as const;

export interface AclResponse {
    aclResources: AclResource[];
}

export interface AclResource {
    resourceType: string;
    resourceName: string;
    resourcePatternType: string;
    acls: AclRule[];
}

export interface AclRule {
    principal: string;
    host: string;
    operation: string;
    permissionType: string;
}


export interface SchemaOverviewResponse {
    schemaOverview: SchemaOverview;
    isConfigured: boolean;
}

export interface SchemaOverview {
    mode: string;
    compatibilityLevel: string;
    subjects: SchemaSubject[];
    requestErrors: SchemaOverviewRequestError[];
}

export interface SchemaOverviewRequestError {
    requestDescription: string;
    errorMessage: string;
}

export interface SchemaSubject { // @martin wtf is schemaSubject? why is this name so confusing?
    name: string;
    compatibilityLevel: string;
    versionsCount: number;
    latestVersion: string;
    requestError: string;
}

export interface SchemaDetailsResponse {
    schemaDetails: SchemaDetails
}

export interface SchemaDetails {
    string: string;
    schemaId: number;
    version: number;
    schema: Schema;
    registeredVersions: number[];
}

export interface Schema {
    doc: string;
    name: string;
    namespace: string;
    type: string;
    fields: SchemaField[];
}

export interface SchemaField {
    name: string;
    type: string | object | null | undefined;
    doc?: string | null | undefined;
    default?: string | object | null | undefined;
}
